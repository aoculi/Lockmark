/**
 * Background script for handling cross-origin requests
 * Fetches metadata (title and favicon) from URLs
 * Updates extension icon based on authentication state
 */

import { STORAGE_KEYS } from '@/lib/constants'
import { fetchMetadata, type MetadataResponse } from '@/lib/pageCapture'
import type { AuthSession } from '@/components/hooks/providers/useAuthSessionProvider'
import type { PinStoreData } from '@/lib/storage'

// Firefox browser API global
declare const browser: typeof chrome | undefined

interface FetchMetadataMessage {
  type: 'FETCH_METADATA'
  url: string
}

/**
 * Update extension icon based on authentication state
 * Works with both Chrome MV3 (action) and Firefox MV2 (browserAction)
 */
async function updateIconForAuthState(isAuthenticated: boolean) {
  try {
    const iconPaths = isAuthenticated
      ? {
          // User is authenticated - use default icons
          16: '/icons/16.png',
          32: '/icons/32.png',
          48: '/icons/48.png',
          128: '/icons/128.png'
        }
      : {
          // User is not authenticated - use locked icon variant
          16: '/icon-locked-16.png',
          32: '/icon-locked-32.png',
          48: '/icon-locked-48.png',
          128: '/icon-locked-128.png'
        }

    // Firefox MV2 uses browser.browserAction
    if (typeof browser !== 'undefined' && browser.browserAction) {
      await browser.browserAction.setIcon({ path: iconPaths })
    }
    // Chrome MV3 uses chrome.action
    else if (chrome.action) {
      await chrome.action.setIcon({ path: iconPaths })
    }
    // Fallback for older Chrome (MV2) - chrome.browserAction
    else if (chrome.browserAction) {
      await chrome.browserAction.setIcon({ path: iconPaths })
    }
  } catch (error) {
    console.error('Failed to update extension icon:', error)
  }
}

/**
 * Check current authentication state
 * Works with both Firefox (browser) and Chrome (chrome) APIs
 * Returns true only if session AND keystore exist AND not locked (fully unlocked)
 */
async function checkAuthState(): Promise<boolean> {
  try {
    // Use browser API for Firefox, chrome API for Chrome
    const storageApi =
      typeof browser !== 'undefined' && browser.storage
        ? browser.storage
        : chrome.storage

    const result = await storageApi.local.get([
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.KEYSTORE,
      STORAGE_KEYS.IS_LOCKED
    ])
    const authSession = result[STORAGE_KEYS.SESSION] as AuthSession | undefined
    const keystore = result[STORAGE_KEYS.KEYSTORE]
    const isLocked = result[STORAGE_KEYS.IS_LOCKED] as boolean | undefined

    // User is fully unlocked only if:
    // - session exists and is valid
    // - keystore exists
    // - NOT explicitly locked
    return !!(
      authSession &&
      authSession.token &&
      authSession.expiresAt &&
      authSession.expiresAt > Date.now() &&
      keystore &&
      !isLocked
    )
  } catch (error) {
    console.error('Failed to check auth state:', error)
    return false
  }
}

/**
 * Parse auto-lock timeout string to milliseconds
 */
function parseAutoLockTimeout(timeout: string): number {
  if (timeout === 'never') {
    return Infinity
  }

  const match = timeout.match(/^(\d+)(min|h)$/)
  if (!match) {
    return 20 * 60 * 1000 // Default 20 minutes
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  if (unit === 'h') {
    return value * 60 * 60 * 1000
  } else {
    return value * 60 * 1000
  }
}

/**
 * Periodically check if auto-lock timeout has been exceeded
 * If yes, set IS_LOCKED flag and clear sensitive data
 * This ensures the lock icon updates even when popup is closed
 */
async function checkAndApplyAutoLock() {
  try {
    const storageApi =
      typeof browser !== 'undefined' && browser.storage
        ? browser.storage
        : chrome.storage

    const result = await storageApi.local.get([
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.KEYSTORE,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.PIN_STORE,
      STORAGE_KEYS.IS_LOCKED
    ])

    const session = result[STORAGE_KEYS.SESSION] as AuthSession | undefined
    const keystore = result[STORAGE_KEYS.KEYSTORE]
    const settings = result[STORAGE_KEYS.SETTINGS]
    const pinStore = result[STORAGE_KEYS.PIN_STORE] as PinStoreData | undefined
    const isLocked = result[STORAGE_KEYS.IS_LOCKED] as boolean | undefined

    // Skip if no session or already locked
    if (!session || !session.token || !session.createdAt || isLocked) {
      return
    }

    // Skip if no keystore (nothing to lock)
    if (!keystore) {
      return
    }

    // Get auto-lock timeout from settings
    const unlockMethod = settings?.unlockMethod || 'password'
    const autoLockTimeout = settings?.autoLockTimeout || '20min'
    const autoLockTimeoutMs = parseAutoLockTimeout(autoLockTimeout)

    // Skip if "never" lock mode
    if (unlockMethod === 'password' && autoLockTimeoutMs === Infinity) {
      return
    }

    // Check if timeout has been exceeded
    const now = Date.now()
    const timeSinceCreation = now - session.createdAt

    if (timeSinceCreation > autoLockTimeoutMs) {
      // Timeout exceeded - lock the vault
      if (unlockMethod === 'pin' && pinStore) {
        // Soft lock: Set IS_LOCKED flag and clear keystore/manifest
        await storageApi.local.set({ [STORAGE_KEYS.IS_LOCKED]: true })
        await storageApi.local.remove([
          STORAGE_KEYS.KEYSTORE,
          STORAGE_KEYS.MANIFEST
        ])
        console.log('Auto-lock: Vault locked (PIN unlock available)')
      } else {
        // Hard lock: Full logout
        await storageApi.local.remove([
          STORAGE_KEYS.SESSION,
          STORAGE_KEYS.KEYSTORE,
          STORAGE_KEYS.MANIFEST,
          STORAGE_KEYS.PIN_STORE,
          STORAGE_KEYS.LOCK_STATE,
          STORAGE_KEYS.IS_LOCKED
        ])
        console.log('Auto-lock: Vault locked (full logout)')
      }
    }
  } catch (error) {
    console.error('Failed to check auto-lock timeout:', error)
  }
}

export default defineBackground(() => {
  // Initialize icon on startup
  checkAuthState().then(updateIconForAuthState)

  // Use cross-browser storage API
  const storageApi =
    typeof browser !== 'undefined' && browser.storage
      ? browser.storage
      : chrome.storage

  // Listen for storage changes to update icon when auth state changes
  storageApi.onChanged.addListener((changes, areaName) => {
    if (
      areaName === 'local' &&
      (changes[STORAGE_KEYS.SESSION] ||
       changes[STORAGE_KEYS.KEYSTORE] ||
       changes[STORAGE_KEYS.IS_LOCKED])
    ) {
      // Re-check full auth state when session, keystore, or lock state changes
      checkAuthState().then(updateIconForAuthState)
    }
  })

  // Periodically check if auto-lock timeout has been exceeded
  // Check every 30 seconds to ensure responsive locking
  const AUTO_LOCK_CHECK_INTERVAL = 30 * 1000 // 30 seconds
  setInterval(() => {
    checkAndApplyAutoLock()
  }, AUTO_LOCK_CHECK_INTERVAL)

  // Also check immediately on startup
  checkAndApplyAutoLock()

  // Listen for messages from popup/content scripts
  chrome.runtime.onMessage.addListener(
    (
      message: FetchMetadataMessage,
      sender,
      sendResponse: (response: MetadataResponse) => void
    ) => {
      if (message.type === 'FETCH_METADATA') {
        fetchMetadata(message.url)
          .then(sendResponse)
          .catch((error) => {
            sendResponse({
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
            })
          })
        // Return true to indicate we will send a response asynchronously
        return true
      }
    }
  )
})
