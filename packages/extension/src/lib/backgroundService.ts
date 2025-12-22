export class BackgroundService {
  constructor() {}

  /**
   * Initialize the background service
   */
  initialize(): void {
    // Set up message listener
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      //   this.messageHandlers
      //     .handleMessage(message as any)
      //     .then((response) => {
      //       if (response !== null) {
      //         sendResponse(response)
      //       }
      //     })
      //     .catch((error) => {
      //       sendResponse({ ok: false, error: String(error) })
      //     })
      //   // Indicates we will send a response asynchronously
      //   return true
      // })
    })
  }
}
