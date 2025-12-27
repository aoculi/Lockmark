import { useMemo } from 'react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import { useTags } from '@/components/hooks/useTags'
import type { Tag } from '@/lib/types'

import { TagCard } from '@/components/parts/Tags/TagCard'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type SortMode = 'alphabetical' | 'bookmarkCount'

type Props = {
  sortMode: SortMode
}

export default function TagList({ sortMode }: Props) {
  const { tags, deleteTag, showHiddenTags } = useTags()
  const { bookmarks } = useBookmarks()
  const { setFlash } = useNavigation()

  // Count bookmarks per tag
  const tagBookmarkCounts = useMemo(() => {
    const counts = new Map<string, number>()
    tags.forEach((tag) => {
      counts.set(tag.id, 0)
    })
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tagId) => {
        const current = counts.get(tagId) || 0
        counts.set(tagId, current + 1)
      })
    })
    return counts
  }, [tags, bookmarks])

  // Count total bookmarks and unsorted bookmarks
  const totalBookmarks = bookmarks.length
  const unsortedBookmarks = bookmarks.filter(
    (bookmark) => bookmark.tags.length === 0
  ).length

  const onDelete = async (id: string) => {
    const tag = tags.find((t) => t.id === id)
    const count = tagBookmarkCounts.get(id) || 0
    const message =
      count === 0
        ? `Are you sure you want to delete the tag "${tag?.name}"?`
        : `Are you sure you want to delete the tag "${tag?.name}"? This will remove it from ${count} bookmark${count === 1 ? '' : 's'}.`
    if (confirm(message)) {
      try {
        await deleteTag(id)
      } catch (error) {
        setFlash(
          'Failed to delete tag: ' +
            ((error as Error).message ?? 'Unknown error')
        )
        setTimeout(() => setFlash(null), 5000)
      }
    }
  }

  // Filter and sort tags
  const sortedTags = useMemo(() => {
    let filtered = showHiddenTags ? tags : tags.filter((tag) => !tag.hidden)

    if (sortMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else {
      filtered = [...filtered].sort((a, b) => {
        const countA = tagBookmarkCounts.get(a.id) || 0
        const countB = tagBookmarkCounts.get(b.id) || 0
        if (countA !== countB) {
          return countB - countA // Descending order
        }
        return a.name.localeCompare(b.name) // Secondary sort by name
      })
    }

    return filtered
  }, [tags, sortMode, tagBookmarkCounts, showHiddenTags])

  return (
    <div className={styles.container}>
      {sortedTags.length === 0 ? (
        <Text size='2' color='light' style={{ padding: '20px 20px 0' }}>
          {tags.length === 0
            ? 'No tags yet. Click "New tag" to create one.'
            : 'No visible tags. Enable hidden tags in settings or create new tags.'}
        </Text>
      ) : (
        <div className={styles.list}>
          <TagCard
            tag={{ id: 'all', name: 'All' }}
            tags={tags}
            bookmarkCount={totalBookmarks}
            showActions={false}
          />
          <TagCard
            tag={{ id: 'unsorted', name: 'Unsorted' }}
            tags={tags}
            bookmarkCount={unsortedBookmarks}
            showActions={false}
          />
          <div className={styles.separator} />
          {sortedTags.map((tag: Tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              tags={tags}
              bookmarkCount={tagBookmarkCounts.get(tag.id) || 0}
              onDelete={onDelete}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
