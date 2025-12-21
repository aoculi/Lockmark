import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuthSession } from '@/components/hooks/providers/useAuthSessionProvider'
import usePopupSize from '@/components/hooks/usePopupSize'
import { STORAGE_KEYS } from '@/lib/constants'
import { captureCurrentPage } from '@/lib/pageCapture'
import { getDefaultSettings, getStorageItem, Settings } from '@/lib/storage'
import type { Bookmark as BookmarkType, ManifestV1, Tag } from '@/lib/types'

import Header from '@/components/parts/Header'
import Button from '@/components/ui/Button'
import ErrorCallout from '@/components/ui/ErrorCallout'
import Input from '@/components/ui/Input'
import { TagSelectorField } from '@/components/ui/TagSelectorField'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { MAX_TAGS_PER_ITEM } from '@/lib/validation'
import styles from './styles.module.css'

const emptyBookmark = {
  url: '',
  title: '',
  picture: '',
  tags: [] as string[]
}

export default function Bookmark({ bookmark }: { bookmark?: BookmarkType }) {
  const { clearSession } = useAuthSession()
  usePopupSize('compact')
  const { navigate } = useNavigation()
  const [tags, setTags] = useState<Tag[]>([])
  const [settings, setSettings] = useState<Settings>(getDefaultSettings())
  const [captureBookmark, setCaptureBookmark] = useState(emptyBookmark)
  const [form, setForm] = useState(emptyBookmark)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)

  // Load tags and settings when the route is displayed
  useEffect(() => {
    const loadData = async () => {
      const [manifest, storedSettings] = await Promise.all([
        getStorageItem<ManifestV1>(STORAGE_KEYS.MANIFEST),
        getStorageItem<Settings>(STORAGE_KEYS.SETTINGS)
      ])

      if (manifest?.tags) {
        setTags(manifest.tags)
      }

      if (storedSettings) {
        setSettings(storedSettings)
      }
    }

    loadData()
  }, [])

  // Capture current page when the route is displayed
  useEffect(() => {
    // if we update a page, do not capture it again
    if (bookmark) {
      return
    }

    const loadCurrentPage = async () => {
      setIsLoading(true)
      setCaptureError(null)

      const result = await captureCurrentPage()
      if (result.ok) {
        const data = {
          url: result.bookmark.url,
          title: result.bookmark.title,
          picture: result.bookmark.picture,
          tags: result.bookmark.tags
        }
        setCaptureBookmark(data)
        setForm(data)
      } else {
        setCaptureError(result.error)
      }

      setIsLoading(false)
    }

    loadCurrentPage()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // URL validation
    if (!form.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        const parsed = new URL(form.url.trim())
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          newErrors.url = 'URL must start with http:// or https://'
        }
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    // Title validation
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    }

    // Tags validation
    if (form.tags.length > MAX_TAGS_PER_ITEM) {
      newErrors.tags = `Maximum ${MAX_TAGS_PER_ITEM} tags per bookmark`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || isLoading) {
      return
    }

    setIsLoading(true)
    try {
      // update bookmark if we have a bookmark value
      // else create bookmark

      navigate('/vault')
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false)
    }
  }

  // Check if there are changes and URL is set
  const hasChanges = useMemo(() => {
    if (!form.url.trim()) {
      return false
    }

    if (!bookmark) {
      // For new bookmarks, there's a change if URL is set
      return true
    }

    // For existing bookmarks, check if any field changed
    const urlChanged = form.url.trim() !== bookmark.url
    const titleChanged = form.title.trim() !== bookmark.title
    const pictureChanged = form.picture.trim() !== bookmark.picture

    // Check if tags changed (compare arrays)
    const tagsChanged =
      form.tags.length !== bookmark.tags.length ||
      form.tags.some((tag) => !bookmark.tags.includes(tag)) ||
      bookmark.tags.some((tag) => !form.tags.includes(tag))

    return urlChanged || titleChanged || pictureChanged || tagsChanged
  }, [form, bookmark])

  const selectableTags = useMemo(() => {
    if (settings.showHiddenTags) {
      return tags
    }

    // Keep already-selected hidden tags visible while hiding them from suggestions
    const selectedHiddenTags = tags.filter(
      (tag) => tag.hidden && form.tags.includes(tag.id)
    )
    const visibleTags = tags.filter((tag) => !tag.hidden)

    return [...visibleTags, ...selectedHiddenTags]
  }, [tags, settings.showHiddenTags, form.tags])

  return (
    <div className={styles.component}>
      <Header title='New' canSwitchToVault={true} />
      <Button onClick={() => clearSession()}>Logout</Button>
      {captureError && <ErrorCallout>{captureError}</ErrorCallout>}
      <div className={styles.container}>
        <div className={styles.content}>
          <img src={form.picture} alt={form.title} />

          <Input type='hidden' value={form.picture} />
          <Input
            error={errors.url}
            // ref={urlField}
            size='lg'
            type='url'
            placeholder='https://example.com'
            value={form.url}
            onChange={(e) => {
              const next = e.target.value
              setForm((prev) => ({ ...prev, url: next }))
              if (errors.url) setErrors({ ...errors, url: '' })
            }}
          />

          <Input
            error={errors.title}
            size='lg'
            type='text'
            value={form.title}
            onChange={(e) => {
              const next = e.target.value
              setForm((prev) => ({ ...prev, title: next }))
              if (errors.title) setErrors({ ...errors, title: '' })
            }}
            placeholder='Bookmark title'
          />

          <TagSelectorField
            tags={selectableTags}
            selectedTags={form.tags}
            onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
          />

          {errors.tags && (
            <span className={styles.fieldError}>{errors.tags}</span>
          )}
        </div>

        <div className={styles.actions}>
          <Button onClick={handleSubmit} disabled={!hasChanges || isLoading}>
            {isLoading && <Loader2 className={styles.spinner} />}
            Create
          </Button>
        </div>
      </div>
    </div>
  )
}
