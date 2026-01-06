import { useMemo } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import {
  countBookmarksPerCollection,
  flattenCollectionsWithDepth,
  type CollectionSortMode
} from '@/lib/collectionUtils'

import { CollectionCard } from '@/components/parts/Collections/CollectionCard'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type Props = {
  sortMode: CollectionSortMode
}

export default function CollectionList({ sortMode }: Props) {
  const { manifest, save } = useManifest()
  const { bookmarks } = useBookmarks()
  const { setFlash } = useNavigation()

  const collections = manifest?.collections || []

  // Count bookmarks per collection based on tag filter
  const collectionBookmarkCounts = useMemo(
    () => countBookmarksPerCollection(collections, bookmarks),
    [collections, bookmarks]
  )

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
  const collectionsWithDepth = useMemo(
    () =>
      flattenCollectionsWithDepth(
        collections,
        sortMode,
        collectionBookmarkCounts
      ),
    [collections, sortMode, collectionBookmarkCounts]
  )

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
