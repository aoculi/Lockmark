/**
 * Page capture utilities for popup/sidepanel
 * Handles getting current tab data and creating bookmark drafts
 */

import type { Bookmark } from '@/lib/types'

/** A draft bookmark created from captured page data */
export type BookmarkDraft = Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>

export type CaptureResult =
  | { ok: true; bookmark: BookmarkDraft }
  | { ok: false; error: string }

/**
 * Internal URLs that cannot be bookmarked
 */
const BLOCKED_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'about:']

/**
 * Check if a URL is bookmarkable
 */
export function isBookmarkableUrl(url: string): boolean {
  return !BLOCKED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}

/**
 * Captures the current page data and returns a bookmark draft.
 * Communicates with the background script to reliably get tab info.
 *
 * @returns A result object containing either a bookmark draft or an error message
 */
export async function captureCurrentPage(): Promise<CaptureResult> {
  type TabResponse =
    | { ok: true; tab: { url: string; title: string; picture?: string } }
    | { ok: false; error: string }

  try {
    const response = await new Promise<TabResponse | undefined>((resolve) => {
      chrome.runtime.sendMessage({ type: 'tabs:getCurrent' }, (response) => {
        resolve(response)
      })
    })

    if (!response) {
      return {
        ok: false,
        error: 'Unable to get current page information'
      }
    }

    if (!response.ok || !response.tab) {
      return {
        ok: false,
        error:
          'error' in response
            ? response.error
            : 'Unable to get current page information'
      }
    }

    const tab = response.tab

    if (!tab?.url || !tab?.title) {
      return {
        ok: false,
        error: 'Unable to get current page information'
      }
    }

    if (!isBookmarkableUrl(tab.url)) {
      return {
        ok: false,
        error: 'Cannot bookmark internal browser pages'
      }
    }

    return {
      ok: true,
      bookmark: {
        url: tab.url,
        title: tab.title,
        picture: tab.picture || '',
        tags: []
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get current page'
    return {
      ok: false,
      error: errorMessage
    }
  }
}
