/**
 * General utilities
 */
import { nanoid } from 'nanoid'

/**
 * Get hostname from URL
 * @param url - Full URL string
 * @returns Hostname or original URL if parsing fails
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Generate a unique ID for bookmarks and tags
 * Uses nanoid for collision-resistant IDs
 * @returns Unique identifier string
 */
export function generateId(): string {
  return nanoid()
}
