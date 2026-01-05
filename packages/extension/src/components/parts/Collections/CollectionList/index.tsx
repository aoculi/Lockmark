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

  // Sort collections
  const sortedCollections = useMemo(() => {
    const sorted = [...collections]

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
  }, [collections, sortMode, collectionBookmarkCounts])

  return (
    <div className={styles.container}>
      {sortedCollections.length === 0 ? (
        <Text size='2' color='light' style={{ padding: '20px 20px 0' }}>
          No collections yet. Click the + button to create one.
        </Text>
      ) : (
        <div className={styles.list}>
          {sortedCollections.map((collection: Collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bookmarkCount={collectionBookmarkCounts.get(collection.id) || 0}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
