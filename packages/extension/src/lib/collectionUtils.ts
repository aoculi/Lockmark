import type { Bookmark, Collection } from '@/lib/types'

/**
 * Collection sort modes for the collections list view
 */
export type CollectionSortMode = 'alphabetical' | 'bookmarkCount'

/**
 * Collection with depth information for tree rendering
 */
export type CollectionWithDepth = {
  collection: Collection
  depth: number
}

/**
 * Collection with bookmarks and depth for displaying in bookmark list
 */
export type CollectionWithBookmarks = {
  collection: Collection
  bookmarks: Bookmark[]
  depth: number
}

/**
 * Filter bookmarks that match a collection's tag filter
 * @param collection - The collection to filter for
 * @param bookmarks - Array of bookmarks to filter
 * @param overrideSortMode - Optional sort mode to override collection's sortMode
 * @returns Filtered and sorted bookmarks matching the collection's criteria
 */
export function getBookmarksForCollection(
  collection: Collection,
  bookmarks: Bookmark[],
  overrideSortMode?: 'updated_at' | 'title'
): Bookmark[] {
  if (collection.tagFilter.tagIds.length === 0) {
    return []
  }

  // Filter bookmarks based on collection's tag filter
  const matching = bookmarks.filter((bookmark) => {
    if (collection.tagFilter.mode === 'any') {
      // Match if bookmark has ANY of the filter tags
      return collection.tagFilter.tagIds.some((tagId) =>
        bookmark.tags.includes(tagId)
      )
    } else {
      // Match if bookmark has ALL of the filter tags
      return collection.tagFilter.tagIds.every((tagId) =>
        bookmark.tags.includes(tagId)
      )
    }
  })

  // Sort using provided sortMode, collection's sortMode, or default to 'updated_at'
  const sortMode = overrideSortMode || collection.sortMode || 'updated_at'
  if (sortMode === 'title') {
    matching.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    matching.sort((a, b) => b.updated_at - a.updated_at)
  }

  return matching
}

/**
 * Count bookmarks per collection
 * @param collections - Array of collections
 * @param bookmarks - Array of bookmarks to count
 * @returns Map of collection ID to bookmark count
 */
export function countBookmarksPerCollection(
  collections: Collection[],
  bookmarks: Bookmark[]
): Map<string, number> {
  const counts = new Map<string, number>()

  collections.forEach((collection) => {
    const matchingBookmarks = getBookmarksForCollection(collection, bookmarks)
    counts.set(collection.id, matchingBookmarks.length)
  })

  return counts
}

/**
 * Build parent-child relationships for collections
 * @param collections - Array of all collections
 * @returns Object with childrenMap and rootCollections
 */
export function buildCollectionHierarchy(collections: Collection[]): {
  childrenMap: Map<string, Collection[]>
  rootCollections: Collection[]
} {
  const childrenMap = new Map<string, Collection[]>()
  const rootCollections: Collection[] = []

  collections.forEach((collection) => {
    if (!collection.parentId) {
      rootCollections.push(collection)
    } else {
      if (!childrenMap.has(collection.parentId)) {
        childrenMap.set(collection.parentId, [])
      }
      childrenMap.get(collection.parentId)!.push(collection)
    }
  })

  return { childrenMap, rootCollections }
}

/**
 * Sort collections by the specified mode
 * @param collections - Array of collections to sort
 * @param sortMode - Sort mode ('alphabetical' or 'bookmarkCount')
 * @param bookmarkCounts - Optional map of collection ID to bookmark count (required for 'bookmarkCount' mode)
 * @returns Sorted array of collections
 */
export function sortCollections(
  collections: Collection[],
  sortMode: CollectionSortMode,
  bookmarkCounts?: Map<string, number>
): Collection[] {
  const sorted = [...collections]

  if (sortMode === 'alphabetical') {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortMode === 'bookmarkCount' && bookmarkCounts) {
    sorted.sort((a, b) => {
      const countA = bookmarkCounts.get(a.id) || 0
      const countB = bookmarkCounts.get(b.id) || 0
      if (countA !== countB) {
        return countB - countA // Descending order
      }
      return a.name.localeCompare(b.name) // Secondary sort by name
    })
  }

  return sorted
}

/**
 * Flatten collection tree with depth information
 * @param collections - Array of all collections
 * @param sortMode - Sort mode for collections
 * @param bookmarkCounts - Optional bookmark counts for sorting by count
 * @returns Flattened array of collections with depth
 */
export function flattenCollectionsWithDepth(
  collections: Collection[],
  sortMode: CollectionSortMode = 'alphabetical',
  bookmarkCounts?: Map<string, number>
): CollectionWithDepth[] {
  const { childrenMap, rootCollections } = buildCollectionHierarchy(collections)

  const flatten = (
    items: Collection[],
    depth: number
  ): CollectionWithDepth[] => {
    const sorted = sortCollections(items, sortMode, bookmarkCounts)
    const result: CollectionWithDepth[] = []

    sorted.forEach((collection) => {
      result.push({ collection, depth })
      const children = childrenMap.get(collection.id) || []
      if (children.length > 0) {
        result.push(...flatten(children, depth + 1))
      }
    })

    return result
  }

  return flatten(rootCollections, 0)
}

/**
 * Flatten collections with their bookmarks and depth for bookmark list view
 * @param collections - Array of all collections
 * @param bookmarks - Array of bookmarks to distribute
 * @param sortMode - Sort mode for bookmarks within collections
 * @returns Flattened array of collections with their bookmarks and depth
 */
export function flattenCollectionsWithBookmarks(
  collections: Collection[],
  bookmarks: Bookmark[],
  sortMode: 'updated_at' | 'title' = 'updated_at'
): CollectionWithBookmarks[] {
  const { childrenMap, rootCollections } = buildCollectionHierarchy(collections)

  // Pre-compute bookmarks for all collections
  const bookmarksByCollectionId = new Map<string, Bookmark[]>()
  collections.forEach((collection) => {
    const collectionBookmarks = getBookmarksForCollection(
      collection,
      bookmarks,
      sortMode
    )
    bookmarksByCollectionId.set(collection.id, collectionBookmarks)
  })

  const flatten = (
    items: Collection[],
    depth: number
  ): CollectionWithBookmarks[] => {
    // Sort collections alphabetically
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
    const result: CollectionWithBookmarks[] = []

    sorted.forEach((collection) => {
      const collectionBookmarks =
        bookmarksByCollectionId.get(collection.id) || []
      result.push({
        collection,
        bookmarks: collectionBookmarks,
        depth
      })

      const children = childrenMap.get(collection.id) || []
      if (children.length > 0) {
        result.push(...flatten(children, depth + 1))
      }
    })

    return result
  }

  return flatten(rootCollections, 0)
}

/**
 * Get all bookmark IDs that belong to any collection
 * @param collectionsWithBookmarks - Array of collections with their bookmarks
 * @returns Set of bookmark IDs that are in at least one collection
 */
export function getBookmarkIdsInCollections(
  collectionsWithBookmarks: CollectionWithBookmarks[]
): Set<string> {
  const ids = new Set<string>()
  collectionsWithBookmarks.forEach(({ bookmarks }) => {
    bookmarks.forEach((bookmark) => ids.add(bookmark.id))
  })
  return ids
}

/**
 * Check if setting a parent would create a circular reference
 * @param collections - Array of all collections
 * @param collectionId - The collection being edited (null for new collections)
 * @param parentId - The proposed parent ID
 * @returns true if this would create a circular reference
 */
export function wouldCreateCircularReference(
  collections: Collection[],
  collectionId: string | null,
  parentId: string | undefined
): boolean {
  if (!parentId) return false

  const checkParent = (id: string, visited: Set<string>): boolean => {
    if (visited.has(id)) return true // Circular reference detected
    if (id === collectionId) return true // Would create a cycle

    const parent = collections.find((c) => c.id === id)
    if (!parent?.parentId) return false

    visited.add(id)
    return checkParent(parent.parentId, visited)
  }

  return checkParent(parentId, new Set())
}
