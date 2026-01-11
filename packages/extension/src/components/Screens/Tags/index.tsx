import { Edit, Lock, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  AuthSessionProvider,
  useAuthSession
} from '@/components/hooks/providers/useAuthSessionProvider'
import { ManifestProvider } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'
import {
  UnlockStateProvider,
  useUnlockState
} from '@/components/hooks/providers/useUnlockStateProvider'
import { useBookmarks } from '@/components/hooks/useBookmarks'
import { useTags } from '@/components/hooks/useTags'
import { openExtensionPage } from '@/lib/tabs'
import type { Bookmark, Tag } from '@/lib/types'

import HiddenToggle from '@/components/parts/HiddenToggle'
import LockMessage from '@/components/parts/LockMessage'
import SmartHeader from '@/components/parts/SmartHeader'
import TagEditForm from '@/components/parts/Tags/TagManageModal/TagEditForm'
import TagItem from '@/components/parts/TagItem'
import ActionBtn from '@/components/ui/ActionBtn'
import { Dialog } from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

function TagsContent() {
  const { isAuthenticated, isLoading } = useAuthSession()
  const {
    isLocked,
    isLoading: unlockLoading,
    canUnlockWithPin
  } = useUnlockState()
  const { tags, showHiddenTags, createTag, deleteTag } = useTags()
  const { bookmarks } = useBookmarks()
  const { setFlash } = useNavigation()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // Filter tags by search and visibility
  const filteredTags = useMemo(() => {
    const visibleTags = showHiddenTags
      ? tags
      : tags.filter((tag: Tag) => !tag.hidden)

    if (!searchQuery.trim()) return visibleTags

    const query = searchQuery.toLowerCase().trim()
    return visibleTags.filter((tag: Tag) =>
      tag.name.toLowerCase().includes(query)
    )
  }, [tags, searchQuery, showHiddenTags])

  const getBookmarkCount = (tagId: string): number => {
    return bookmarks.filter((b: Bookmark) => b.tags.includes(tagId)).length
  }

  const handleTagClick = (tagId: string) => {
    // Open app page with tag filter
    // We'll encode the tag ID in the URL hash
    const runtime =
      (typeof chrome !== 'undefined' && chrome.runtime) ||
      (typeof browser !== 'undefined' && browser.runtime)

    if (runtime) {
      const appUrl = runtime.getURL(`/app.html#tag=${tagId}` as any)
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
          const windowId = currentTabs?.[0]?.windowId
          chrome.tabs.create({ url: appUrl, ...(windowId ? { windowId } : {}) })
        })
      } else if (typeof browser !== 'undefined' && browser.tabs?.create) {
        browser.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
          const windowId = currentTabs?.[0]?.windowId
          browser.tabs.create({ url: appUrl, ...(windowId ? { windowId } : {}) })
        })
      } else {
        window.open(appUrl, '_blank')
      }
    }
  }

  const handleDelete = async (tag: Tag) => {
    const count = getBookmarkCount(tag.id)

    const message =
      count === 0
        ? `Delete tag "${tag.name}"?`
        : `Delete tag "${tag.name}"? It will be removed from ${count} bookmark${count === 1 ? '' : 's'}.`

    if (confirm(message)) {
      try {
        await deleteTag(tag.id)
      } catch (error) {
        setFlash(`Failed to delete tag: ${(error as Error).message}`)
      }
    }
  }

  const handleCreateTag = async () => {
    const name = searchQuery.trim()
    if (!name) return

    const existing = tags.find(
      (t: Tag) => t.name.toLowerCase() === name.toLowerCase()
    )

    if (existing) {
      setFlash('A tag with this name already exists')
      return
    }

    try {
      await createTag({ name, hidden: false })
      setSearchQuery('')
    } catch (error) {
      setFlash(`Failed to create tag: ${(error as Error).message}`)
    }
  }

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
          <div className={styles.pageHeader}>
            <Text as='h1' size='5' weight='semibold'>
              Tags
            </Text>
            <Text size='2' color='light'>
              Manage your tags and click on any tag to view its bookmarks
            </Text>
          </div>

          <div className={styles.searchContainer}>
            <Input
              type='text'
              placeholder='Search or create tag...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              size='md'
            >
              <Search size={16} />
            </Input>
            {searchQuery.trim() && !tags.find(
              (t: Tag) => t.name.toLowerCase() === searchQuery.toLowerCase().trim()
            ) && (
              <button
                type='button'
                className={styles.createButton}
                onClick={handleCreateTag}
              >
                <Plus size={16} />
                <span>Create "{searchQuery.trim()}"</span>
              </button>
            )}
          </div>

          <div className={styles.tagsList}>
            {filteredTags.length === 0 ? (
              <div className={styles.emptyState}>
                <Text size='2' color='light'>
                  {searchQuery.trim()
                    ? 'No tags found. Press Enter to create one.'
                    : 'No tags yet. Create your first tag above.'}
                </Text>
              </div>
            ) : (
              filteredTags.map((tag: Tag) => {
                const count = getBookmarkCount(tag.id)
                return (
                  <div key={tag.id} className={styles.tagRow}>
                    <button
                      type='button'
                      className={styles.tagContent}
                      onClick={() => handleTagClick(tag.id)}
                    >
                      <TagItem
                        tagId={tag.id}
                        tagName={tag.name}
                        tags={tags}
                        size='default'
                      />
                      <Text size='1' color='light' className={styles.tagCount}>
                        {count} bookmark{count !== 1 ? 's' : ''}
                      </Text>
                    </button>
                    <div className={styles.tagActions}>
                      <ActionBtn
                        icon={Edit}
                        size='sm'
                        onClick={() => setEditingTag(tag)}
                        title='Edit tag'
                      />
                      <ActionBtn
                        icon={Trash2}
                        size='sm'
                        danger
                        onClick={() => handleDelete(tag)}
                        title='Delete tag'
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Dialog
        title='Edit Tag'
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        width={420}
        showCloseButton={false}
      >
        {editingTag && (
          <TagEditForm tag={editingTag} onClose={() => setEditingTag(null)} />
        )}
      </Dialog>
    </div>
  )
}

export default function Tags() {
  return (
    <AuthSessionProvider>
      <SettingsProvider>
        <UnlockStateProvider>
          <ManifestProvider>
            <TagsContent />
          </ManifestProvider>
        </UnlockStateProvider>
      </SettingsProvider>
    </AuthSessionProvider>
  )
}
