/**
 * General utilities
 */
import { nanoid } from 'nanoid';

/**
 * Format date from timestamp
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
}

/**
 * Get hostname from URL
 */
export function getHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

/**
 * Generate a unique ID for bookmarks and tags
 */
export function generateId(): string {
    return nanoid();
}

