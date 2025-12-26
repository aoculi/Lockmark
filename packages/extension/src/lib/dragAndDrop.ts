/**
 * Drag and Drop utilities for bookmark-tag interactions
 */

export const BOOKMARK_DRAG_TYPE = 'bookmarkId' as const

/**
 * Check if a drag event is a bookmark drag
 */
export function isBookmarkDrag(e: React.DragEvent): boolean {
  try {
    const types = Array.from(e.dataTransfer.types)
    return (
      types.includes(BOOKMARK_DRAG_TYPE) ||
      (e.dataTransfer.effectAllowed === 'move' && types.length > 0)
    )
  } catch {
    return false
  }
}

/**
 * Setup drag data for a bookmark card
 */
export function setupBookmarkDrag(
  e: React.DragEvent,
  bookmarkId: string
): void {
  e.dataTransfer.setData(BOOKMARK_DRAG_TYPE, bookmarkId)
  e.dataTransfer.effectAllowed = 'move'
}

/**
 * Extract bookmark ID from drop event
 */
export function getBookmarkIdFromDrop(e: React.DragEvent): string | null {
  const bookmarkId = e.dataTransfer.getData(BOOKMARK_DRAG_TYPE)
  return bookmarkId || null
}

/**
 * Check if a tag can accept a bookmark drop
 */
export function canTagAcceptDrop(
  e: React.DragEvent,
  isAllTag: boolean,
  tagId?: string
): boolean {
  return !isAllTag && !!tagId && isBookmarkDrag(e)
}

/**
 * Handle drag enter/over event for tag drop zone
 */
export function handleTagDragOver(
  e: React.DragEvent,
  isAllTag: boolean,
  tagId?: string
): boolean {
  if (canTagAcceptDrop(e, isAllTag, tagId)) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    return true
  }
  return false
}

/**
 * Check if drag is leaving the element boundaries
 */
export function isDragLeavingElement(
  e: React.DragEvent,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect()
  const { clientX: x, clientY: y } = e
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom
}
