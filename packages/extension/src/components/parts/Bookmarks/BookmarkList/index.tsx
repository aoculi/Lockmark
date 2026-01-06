import { Folder } from 'lucide-react'
import { useMemo } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import { useTags } from '@/components/hooks/useTags'
import { getIconByName } from '@/components/ui/IconPicker'
import { processBookmarks } from '@/lib/bookmarkUtils'
import {
  flattenCollectionsWithBookmarks,
  getBookmarkIdsInCollections
} from '@/lib/collectionUtils'
import type { Bookmark } from '@/lib/types'

import { BookmarkCard } from '@/components/parts/Bookmarks/BookmarkCard'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type Props = {
  searchQuery: string
  currentTagId: string | null
  sortMode: 'updated_at' | 'title'
  selectedTags: string[]
  selectedBookmarkIds: Set<string>
  onSelectedBookmarkIdsChange: (ids: Set<string>) => void
}

export default function BookmarkList({
  searchQuery,
  currentTagId,
  sortMode,
  selectedTags,
  selectedBookmarkIds,
  onSelectedBookmarkIdsChange
}: Props) {
  const { bookmarks, deleteBookmark } = useBookmarks()
  const { tags, showHiddenTags } = useTags()
  const { setFlash } = useNavigation()
  const { manifest } = useManifest()

  const onDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      try {
        await deleteBookmark(id)
      } catch (error) {
        setFlash(
          'Failed to delete bookmark: ' +
            ((error as Error).message ?? 'Unknown error')
        )

        setTimeout(() => setFlash(null), 5000)
      }
    }
  }

  const handleBookmarkToggle = (id: string) => {
    const newSelected = new Set(selectedBookmarkIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    onSelectedBookmarkIdsChange(newSelected)
  }

  // Process bookmarks: filter and sort
  const { visibleBookmarks, pinnedBookmarks, nonPinnedBookmarks } = useMemo(
    () =>
      processBookmarks(bookmarks, tags, {
        searchQuery,
        selectedTags,
        sortMode,
        showHiddenTags,
        currentTagId
      }),
    [
      bookmarks,
      tags,
      searchQuery,
      selectedTags,
      sortMode,
      showHiddenTags,
      currentTagId
    ]
  )

  // Get collections
  const collections = manifest?.collections || []

  // Group bookmarks by collection and build tree structure
  const collectionsWithBookmarks = useMemo(
    () =>
      flattenCollectionsWithBookmarks(
        collections,
        nonPinnedBookmarks,
        sortMode
      ),
    [collections, nonPinnedBookmarks, sortMode]
  )

  // Get IDs of bookmarks that belong to any collection
  const bookmarkIdsInCollections = useMemo(
    () => getBookmarkIdsInCollections(collectionsWithBookmarks),
    [collectionsWithBookmarks]
  )

  return (
    <div className={styles.container}>
      {visibleBookmarks.length === 0 ? (
        <Text size='2' color='light' style={{ padding: '20px 20px 0' }}>
          {bookmarks.length === 0
            ? 'No bookmarks yet. Click "Add Bookmark" to get started.'
            : 'No visible bookmarks. Enable hidden tags in settings or add new bookmarks.'}
        </Text>
      ) : pinnedBookmarks.length === 0 && nonPinnedBookmarks.length === 0 ? (
        <Text size='2' color='light' style={{ padding: '20px 20px 0' }}>
          No bookmarks match your search.
        </Text>
      ) : (
        <div className={styles.list}>
          {pinnedBookmarks.map((bookmark: Bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              tags={tags}
              onDelete={onDelete}
              isSelected={selectedBookmarkIds.has(bookmark.id)}
              onToggleSelect={() => handleBookmarkToggle(bookmark.id)}
            />
          ))}
          {pinnedBookmarks.length > 0 &&
            (nonPinnedBookmarks.length > 0 ||
              collectionsWithBookmarks.length > 0) && (
              <div className={styles.separator} />
            )}
          {collectionsWithBookmarks.map(
            ({ collection, bookmarks: collectionBookmarks, depth }) => {
              const Icon = collection.icon
                ? getIconByName(collection.icon)
                : Folder
              return (
                <div key={collection.id} className={styles.collectionGroup}>
                  <div
                    className={styles.collectionHeader}
                    style={{ paddingLeft: `${depth * 20 + 12}px` }}
                  >
                    <Icon size={16} className={styles.collectionIcon} />
                    <Text size='2' weight='medium' color='light'>
                      {collection.name}
                      {collectionBookmarks.length > 0 && (
                        <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                          ({collectionBookmarks.length})
                        </span>
                      )}
                    </Text>
                  </div>
                  {collectionBookmarks.length > 0 &&
                    collectionBookmarks.map((bookmark: Bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        tags={tags}
                        onDelete={onDelete}
                        isSelected={selectedBookmarkIds.has(bookmark.id)}
                        onToggleSelect={() => handleBookmarkToggle(bookmark.id)}
                      />
                    ))}
                </div>
              )
            }
          )}
          {/* Show remaining non-pinned bookmarks that don't belong to any collection */}
          {nonPinnedBookmarks
            .filter((bookmark) => !bookmarkIdsInCollections.has(bookmark.id))
            .map((bookmark: Bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                tags={tags}
                onDelete={onDelete}
                isSelected={selectedBookmarkIds.has(bookmark.id)}
                onToggleSelect={() => handleBookmarkToggle(bookmark.id)}
              />
            ))}
        </div>
      )}
    </div>
  )
}
