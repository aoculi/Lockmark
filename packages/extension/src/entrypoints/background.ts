/**
 * Background script for handling cross-origin requests
 * Fetches metadata (title and favicon) from URLs
 */

import { fetchMetadata, type MetadataResponse } from '@/lib/pageCapture'

interface FetchMetadataMessage {
  type: 'FETCH_METADATA'
  url: string
}

export default defineBackground(() => {
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
