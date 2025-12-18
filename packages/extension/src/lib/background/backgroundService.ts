import { AutoLockTimer } from '@/lib/background/autoLockTimer'
import { KeyStore } from '@/lib/background/keystore'
import { MessageHandlers } from '@/lib/background/messageHandlers'
import { SessionManager } from '@/lib/background/session'
import { TokenRefresh } from '@/lib/background/tokenRefresh'

export class BackgroundService {
  private keystore: KeyStore
  private sessionManager: SessionManager
  private tokenRefresh: TokenRefresh
  private autoLockTimer: AutoLockTimer
  private messageHandlers: MessageHandlers

  constructor() {
    this.keystore = new KeyStore()
    this.sessionManager = new SessionManager()
    this.tokenRefresh = new TokenRefresh()
    this.autoLockTimer = new AutoLockTimer()
    this.messageHandlers = new MessageHandlers(
      this.keystore,
      this.sessionManager,
      this.autoLockTimer,
      this.tokenRefresh
    )

    // Set up session callback for auto-lock timer reset
    this.sessionManager.setOnSessionSetCallback((session) => {
      this.autoLockTimer.resetTimer(
        this.keystore,
        this.sessionManager.getSession(),
        this.tokenRefresh,
        (s) => this.sessionManager.setSession(s),
        true // Skip refresh since session was just updated
      )
    })
  }

  /**
   * Open the sidepanel in the current window
   */
  private async openSidepanel(): Promise<void> {
    const browser = (globalThis as any).browser || chrome
    if (browser.sidebarAction) {
      // Firefox: use sidebarAction API
      await browser.sidebarAction.open()
      return
    }

    // Chrome/Edge: use sidePanel API
    if (chrome.sidePanel) {
      const currentWindow = await chrome.windows.getLastFocused()
      if (currentWindow?.id) {
        await chrome.sidePanel.open({ windowId: currentWindow.id })
      }
    }
  }

  /**
   * Initialize the background service
   */
  initialize(): void {
    // Set the sidepanel path and enable it (Chrome/Edge)
    if (chrome.sidePanel) {
      chrome.sidePanel
        .setOptions({
          path: 'sidepanel/index.html',
          enabled: true
        })
        .catch(() => {
          // Ignore errors if sidepanel is not supported or already configured
        })
    }

    // Set up context menu on install/startup
    this.setupContextMenu()

    // Also set up context menu when extension is installed/updated
    chrome.runtime.onInstalled.addListener(() => {
      this.setupContextMenu()
    })

    // Set up message listener
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.messageHandlers
        .handleMessage(message as any)
        .then((response) => {
          if (response !== null) {
            sendResponse(response)
          }
        })
        .catch((error) => {
          sendResponse({ ok: false, error: String(error) })
        })

      // Indicates we will send a response asynchronously
      return true
    })

    chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
      if (msg.type === 'OPEN_SIDE_PANEL') {
        // requires a user gesture; calling it from popup click counts
        const browser = (globalThis as any).browser || chrome
        if (browser.sidebarAction) {
          // Firefox
          browser.sidebarAction.open()
        } else if (chrome.sidePanel) {
          // Chrome/Edge
          chrome.sidePanel.open({ windowId: msg.windowId })
        }
      }
    })

    // Handle keyboard shortcut command
    if (chrome.commands) {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'open-sidepanel') {
          this.openSidepanel()
        }
      })
    }

    // Handle context menu clicks
    if (chrome.contextMenus) {
      chrome.contextMenus.onClicked.addListener((info) => {
        if (info.menuItemId === 'open-sidepanel') {
          this.openSidepanel()
        }
      })
    }
  }

  /**
   * Set up the context menu item for opening the sidepanel
   */
  private setupContextMenu(): void {
    if (!chrome.contextMenus) {
      return
    }

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'open-sidepanel',
        title: 'Open Sidepanel',
        contexts: ['browser_action']
      })
    })
  }
}
