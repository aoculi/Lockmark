/**
 * ID generation utilities
 */
import { nanoid } from 'nanoid';

/**
 * Generate a unique ID for bookmarks and tags
 */
export function generateId(): string {
    return nanoid();
}
