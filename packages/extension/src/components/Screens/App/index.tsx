import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  AuthSessionProvider,
  useAuthSession
} from '@/components/hooks/providers/useAuthSessionProvider'
import { ManifestProvider } from '@/components/hooks/providers/useManifestProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'
import {
  UnlockStateProvider,
  useUnlockState
} from '@/components/hooks/providers/useUnlockStateProvider'
import { useTags } from '@/components/hooks/useTags'
import type { Bookmark } from '@/lib/types'

import BookmarkEditModal from '@/components/parts/Bookmarks/BookmarkEditModal'
import CollectionsList from '@/components/parts/CollectionsList'
import CreateCollection from '@/components/parts/CreateCollection'
import HiddenToggle from '@/components/parts/HiddenToggle'
import LockMessage from '@/components/parts/LockMessage'
import PinnedList from '@/components/parts/PinnedList'
import PinnedTags from '@/components/parts/PinnedTags'
import SmartHeader from '@/components/parts/SmartHeader'
import SmartSearch from '@/components/parts/SmartSearch'
import TagManageModal from '@/components/parts/Tags/TagManageModal'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuthSession()
  const {
    isLocked,
    isLoading: unlockLoading,
    canUnlockWithPin
  } = useUnlockState()
  const { tags } = useTags()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [showTagManageModal, setShowTagManageModal] = useState(false)
  const [bookmarkForTags, setBookmarkForTags] = useState<Bookmark | null>(null)
  const [hasInitializedFromHash, setHasInitializedFromHash] = useState(false)

  // Parse URL hash for tag filter on mount (only once)
  useEffect(() => {
    if (hasInitializedFromHash || tags.length === 0) return

    const hash = window.location.hash
    if (hash && hash.startsWith('#tag=')) {
      const tagId = hash.substring(5) // Remove '#tag='
      // Validate that the tag exists before adding it
      if (tagId && tags.some((tag) => tag.id === tagId)) {
        setSelectedTags([tagId])
      }
    }
    setHasInitializedFromHash(true)
  }, [tags, hasInitializedFromHash])

  if (isLoading || unlockLoading) {
    return (
      <div className={styles.component}>
        <div className={styles.lockScreen}>
          <div className={styles.lockContent}>
            <div className={styles.lockIconWrapper}>
              <Lock size={32} strokeWidth={1.5} />
            </div>
            <Text size='3' color='light'>
              Loading...
            </Text>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || isLocked) {
    return <LockMessage canUnlockWithPin={canUnlockWithPin} />
  }

  return (
    <div className={styles.component}>
      <div className={styles.header}>
        <SmartHeader />
        <HiddenToggle />
      </div>
      <div className={styles.content}>
        <div className={styles.container}>
          <SmartSearch
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            onSearchChange={setSearchQuery}
            onSelectedTagsChange={setSelectedTags}
          />
          <PinnedTags
            selectedTags={selectedTags}
            onTagClick={(tagId) => {
              setSelectedTags((prev) =>
                prev.includes(tagId)
                  ? prev.filter((id) => id !== tagId)
                  : [...prev, tagId]
              )
            }}
            onManageTags={() => {
              setBookmarkForTags(null)
              setShowTagManageModal(true)
            }}
          />
          <PinnedList
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            onEdit={setEditingBookmark}
            onAddTags={(bookmark) => {
              setBookmarkForTags(bookmark)
              setShowTagManageModal(true)
            }}
          />
          <CreateCollection />
          <CollectionsList
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            onEdit={setEditingBookmark}
            onAddTags={(bookmark) => {
              setBookmarkForTags(bookmark)
              setShowTagManageModal(true)
            }}
          />
        </div>
      </div>
      <BookmarkEditModal
        bookmark={editingBookmark}
        onClose={() => setEditingBookmark(null)}
      />
      <TagManageModal
        open={showTagManageModal}
        onClose={() => {
          setShowTagManageModal(false)
          setBookmarkForTags(null)
        }}
        bookmark={bookmarkForTags}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthSessionProvider>
      <SettingsProvider>
        <UnlockStateProvider>
          <ManifestProvider>
            <AppContent />
          </ManifestProvider>
        </UnlockStateProvider>
      </SettingsProvider>
    </AuthSessionProvider>
  )
}
