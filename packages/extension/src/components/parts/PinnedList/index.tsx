import { Pin } from 'lucide-react'
import { useMemo } from 'react'

import { useBookmarks } from '@/components/hooks/useBookmarks'
import { useTags } from '@/components/hooks/useTags'
import type { Bookmark } from '@/lib/types'

import BookmarkRow from '@/components/parts/BookmarkRow'
import Collapsible from '@/components/parts/Collapsible'

import styles from './styles.module.css'

export default function PinnedList() {
  const { bookmarks } = useBookmarks()
  const { tags } = useTags()

  const pinnedBookmarks = useMemo(() => {
    return bookmarks
      .filter((bookmark: Bookmark) => bookmark.pinned)
      .sort((a: Bookmark, b: Bookmark) => b.updated_at - a.updated_at)
  }, [bookmarks])

  if (pinnedBookmarks.length === 0) {
    return null
  }

  return (
    <div className={styles.component}>
      <Collapsible
        icon={Pin}
        label="Pinned"
        count={pinnedBookmarks.length}
        defaultOpen={true}
      >
        <div className={styles.list}>
          {pinnedBookmarks.map((bookmark: Bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark}
              tags={tags}
            />
          ))}
        </div>
      </Collapsible>
    </div>
  )
}
