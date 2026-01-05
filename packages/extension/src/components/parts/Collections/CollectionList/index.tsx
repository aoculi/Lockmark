import { useMemo } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import type { Collection } from '@/lib/types'

import { CollectionCard } from '@/components/parts/Collections/CollectionCard'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type SortMode = 'alphabetical' | 'bookmarkCount'

type Props = {
  sortMode: SortMode
}

export default function CollectionList({ sortMode }: Props) {
  const { manifest, save } = useManifest()
  const { bookmarks } = useBookmarks()
  const { setFlash } = useNavigation()

  const collections = manifest?.collections || []

  // Count bookmarks per collection based on tag filter
  const collectionBookmarkCounts = useMemo(() => {
    const counts = new Map<string, number>()

    collections.forEach((collection) => {
      const matchingBookmarks = bookmarks.filter((bookmark) => {
        if (collection.tagFilter.tagIds.length === 0) {
          return false
        }

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

      counts.set(collection.id, matchingBookmarks.length)
    })

    return counts
  }, [collections, bookmarks])

  const onDelete = async (id: string) => {
    const collection = collections.find((c) => c.id === id)
    if (!collection || !manifest) return

    if (
      confirm(
        `Are you sure you want to delete the collection "${collection.name}"?`
      )
    ) {
      try {
        await save({
          ...manifest,
          collections: collections.filter((c) => c.id !== id)
        })
      } catch (error) {
        setFlash(
          'Failed to delete collection: ' +
            ((error as Error).message ?? 'Unknown error')
        )
        setTimeout(() => setFlash(null), 5000)
      }
    }
  }

  // Build tree structure and flatten with depth information
  const collectionsWithDepth = useMemo(() => {
    type CollectionWithDepth = {
      collection: Collection
      depth: number
    }

    // Build parent-child relationships
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

    // Sort function for collections
    const sortCollections = (items: Collection[]): Collection[] => {
      const sorted = [...items]
      if (sortMode === 'alphabetical') {
        sorted.sort((a, b) => a.name.localeCompare(b.name))
      } else {
        sorted.sort((a, b) => {
          const countA = collectionBookmarkCounts.get(a.id) || 0
          const countB = collectionBookmarkCounts.get(b.id) || 0
          if (countA !== countB) {
            return countB - countA // Descending order
          }
          return a.name.localeCompare(b.name) // Secondary sort by name
        })
      }
      return sorted
    }

    // Recursively build flattened list with depth
    const flattenWithDepth = (
      items: Collection[],
      depth: number
    ): CollectionWithDepth[] => {
      const sorted = sortCollections(items)
      const result: CollectionWithDepth[] = []

      sorted.forEach((collection) => {
        result.push({ collection, depth })
        const children = childrenMap.get(collection.id) || []
        if (children.length > 0) {
          result.push(...flattenWithDepth(children, depth + 1))
        }
      })

      return result
    }

    return flattenWithDepth(rootCollections, 0)
  }, [collections, sortMode, collectionBookmarkCounts])

  return (
    <div className={styles.container}>
      {collectionsWithDepth.length === 0 ? (
        <Text size='2' color='light' style={{ padding: '20px 20px 0' }}>
          No collections yet. Click the + button to create one.
        </Text>
      ) : (
        <div className={styles.list}>
          {collectionsWithDepth.map(({ collection, depth }) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bookmarkCount={collectionBookmarkCounts.get(collection.id) || 0}
              onDelete={onDelete}
              depth={depth}
            />
          ))}
        </div>
      )}
    </div>
  )
}
