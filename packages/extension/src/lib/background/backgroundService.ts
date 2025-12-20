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
   * Initialize the background service
   */
  initialize(): void {
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
  }
}
