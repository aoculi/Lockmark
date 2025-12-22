import { useCallback, useEffect, useState } from 'react'

import { useQueryVault } from '@/components/hooks/queries/useQueryVault'
import { STORAGE_KEYS } from '@/lib/constants'
import { getStorageItem, setStorageItem } from '@/lib/storage'
import type { ManifestV1 } from '@/lib/types'

/**
 * Manifest data stored in chrome.storage.local
 * Combines manifest with its sync metadata
 */
export type StoredManifestData = {
  manifest: ManifestV1
  etag: string | null
  serverVersion: number
}

/**
 * Load manifest data from storage
 * @returns Manifest data or null if not found
 * @throws StorageError if storage operation fails (not just "not found")
 */
export async function loadManifestData(): Promise<StoredManifestData | null> {
  // Try new format first
  const stored = await getStorageItem<StoredManifestData>(STORAGE_KEYS.MANIFEST)
  if (stored?.manifest) {
    return stored
  }

  // Backwards compatibility: check for old separate storage format
  const oldManifest = await getStorageItem<ManifestV1>(STORAGE_KEYS.MANIFEST)
  if (oldManifest && 'items' in oldManifest) {
    // Try to get old metadata, but don't fail if it doesn't exist
    const oldMeta = await getStorageItem<{ etag: string; version: number }>(
      'manifest_meta'
    ).catch(() => null)
    return {
      manifest: oldManifest,
      etag: oldMeta?.etag ?? null,
      serverVersion: oldMeta?.version ?? oldManifest.version ?? 0
    }
  }

  return null
}

/**
 * Save manifest data to storage
 */
export async function saveManifestData(
  data: StoredManifestData
): Promise<void> {
  await setStorageItem(STORAGE_KEYS.MANIFEST, data)
}

/**
 * Hook for managing manifest state with automatic sync
 *
 * Provides:
 * - Current manifest state
 * - save() function that handles etag/version automatically
 * - Loading and saving states
 */
export function useManifest() {
  const { saveManifest: saveManifestMutation } = useQueryVault()

  const [manifest, setManifest] = useState<ManifestV1 | null>(null)
  const [etag, setEtag] = useState<string | null>(null)
  const [serverVersion, setServerVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load manifest on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadManifestData()
        if (data) {
          setManifest(data.manifest)
          setEtag(data.etag)
          setServerVersion(data.serverVersion)
        }
      } catch (error) {
        // Log storage errors but don't crash the app
        console.error('Failed to load manifest from storage:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  /**
   * Save an updated manifest to server and storage
   * Automatically handles etag, version, and conflict resolution
   */
  const save = useCallback(
    async (updatedManifest: ManifestV1) => {
      if (!manifest) {
        throw new Error('Cannot save: manifest not loaded')
      }

      const result = await saveManifestMutation.mutateAsync({
        manifest: updatedManifest,
        etag,
        serverVersion,
        baseSnapshot: manifest
      })

      // Update storage
      try {
        await saveManifestData({
          manifest: result.manifest,
          etag: result.etag,
          serverVersion: result.version
        })
      } catch (error) {
        // Log storage error but don't fail the save operation
        // The server already has the data, local storage is just a cache
        console.error('Failed to save manifest to local storage:', error)
      }

      // Update local state
      setManifest(result.manifest)
      setEtag(result.etag)
      setServerVersion(result.version)

      return result
    },
    [manifest, etag, serverVersion, saveManifestMutation]
  )

  /**
   * Reload manifest from storage (useful after external updates)
   */
  const reload = useCallback(async () => {
    const data = await loadManifestData()
    if (data) {
      setManifest(data.manifest)
      setEtag(data.etag)
      setServerVersion(data.serverVersion)
    }
  }, [])

  return {
    manifest,
    isLoading,
    isSaving: saveManifestMutation.isPending,
    save,
    reload
  }
}
