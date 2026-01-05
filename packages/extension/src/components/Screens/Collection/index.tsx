import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useManifest } from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import usePopupSize from '@/components/hooks/usePopupSize'
import { useTags } from '@/components/hooks/useTags'
import type { Collection as CollectionType } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { validateCollectionName } from '@/lib/validation'

import Header from '@/components/parts/Header'
import Button from '@/components/ui/Button'
import IconPicker from '@/components/ui/IconPicker'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { TagSelectorField } from '@/components/ui/TagSelectorField'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

const defaultCollection = {
  name: '',
  icon: undefined as string | undefined,
  parentId: undefined as string | undefined,
  tagFilter: {
    mode: 'any' as 'any' | 'all',
    tagIds: [] as string[]
  }
}

export default function Collection() {
  usePopupSize('compact')
  const { tags } = useTags()
  const { manifest, save } = useManifest()
  const { navigate, selectedCollection, setFlash } = useNavigation()

  const collection = useMemo(() => {
    return (
      manifest?.collections?.find(
        (c: CollectionType) => c.id === selectedCollection
      ) || null
    )
  }, [manifest?.collections, selectedCollection])

  const [form, setForm] = useState(defaultCollection)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (collection) {
      setForm({
        name: collection.name,
        icon: collection.icon,
        parentId: collection.parentId,
        tagFilter: {
          mode: collection.tagFilter.mode,
          tagIds: [...collection.tagFilter.tagIds]
        }
      })
    }
  }, [collection])

  // Helper function to check for circular references
  const wouldCreateCircularReference = (
    collectionId: string | null,
    parentId: string | undefined
  ): boolean => {
    if (!parentId || !manifest?.collections) return false

    // Check if the selected parent would create a circular reference
    const checkParent = (id: string, visited: Set<string>): boolean => {
      if (visited.has(id)) return true // Circular reference detected
      if (id === collectionId) return true // Would create a cycle

      const parent = manifest.collections?.find((c) => c.id === id)
      if (!parent?.parentId) return false

      visited.add(id)
      return checkParent(parent.parentId, visited)
    }

    return checkParent(parentId, new Set())
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    const validationError = validateCollectionName(form.name)
    if (validationError) {
      newErrors.name = validationError
    }

    // Tag validation - at least one tag required
    if (form.tagFilter.tagIds.length === 0) {
      newErrors.tags = 'Select at least one tag'
    }

    // Circular reference validation
    if (wouldCreateCircularReference(collection?.id || null, form.parentId)) {
      newErrors.parentId =
        'Cannot select this parent as it would create a circular reference'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || isLoading || !manifest) {
      return
    }

    setIsLoading(true)

    try {
      const now = Date.now()

      if (collection) {
        // Update existing collection
        const updatedCollections = (manifest.collections || []).map((c) =>
          c.id === collection.id
            ? {
                ...c,
                name: form.name.trim(),
                icon: form.icon,
                parentId: form.parentId || undefined,
                tagFilter: form.tagFilter,
                updated_at: now
              }
            : c
        )

        await save({
          ...manifest,
          collections: updatedCollections
        })
      } else {
        // Create new collection
        const newCollection: CollectionType = {
          id: generateId(),
          name: form.name.trim(),
          icon: form.icon,
          parentId: form.parentId || undefined,
          tagFilter: form.tagFilter,
          created_at: now,
          updated_at: now
        }

        await save({
          ...manifest,
          collections: [...(manifest.collections || []), newCollection]
        })
      }

      navigate('/collections')
    } catch (error) {
      setFlash(
        'Failed to save collection: ' +
          ((error as Error).message ?? 'Unknown error')
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Check if there are changes and name is set
  const hasChanges = useMemo(() => {
    if (!form.name.trim() || form.tagFilter.tagIds.length === 0) {
      return false
    }

    if (!collection) {
      // For new collections, there's a change if name and tags are set
      return true
    }

    // For existing collections, check if name, icon, parentId, or tagFilter changed
    const tagIdsChanged =
      form.tagFilter.tagIds.length !== collection.tagFilter.tagIds.length ||
      form.tagFilter.tagIds.some(
        (id) => !collection.tagFilter.tagIds.includes(id)
      )

    return (
      form.name.trim() !== collection.name ||
      form.icon !== collection.icon ||
      form.parentId !== collection.parentId ||
      form.tagFilter.mode !== collection.tagFilter.mode ||
      tagIdsChanged
    )
  }, [form, collection])

  return (
    <div className={styles.component}>
      <Header
        title={collection ? 'Edit collection' : 'New collection'}
        canSwitchToVault={true}
      />

      <div className={styles.page}>
        <div className={styles.content}>
          <Input
            error={errors.name}
            size='lg'
            type='text'
            placeholder='Collection name'
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value
              setForm((prev) => ({ ...prev, name: nextName }))
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
          />

          <div className={styles.section}>
            <Text as='label' size='2' className={styles.sectionLabel}>
              Icon
            </Text>
            <IconPicker
              value={form.icon}
              onChange={(icon) => setForm((prev) => ({ ...prev, icon }))}
            />
          </div>

          <div className={styles.section}>
            <Text as='label' size='2' className={styles.sectionLabel}>
              Parent collection
            </Text>
            <Select
              size='lg'
              error={errors.parentId}
              value={form.parentId || ''}
              onChange={(e) => {
                const newParentId = e.target.value || undefined
                setForm((prev) => ({
                  ...prev,
                  parentId: newParentId
                }))
                if (errors.parentId) setErrors({ ...errors, parentId: '' })
              }}
            >
              <option value=''>None (root level)</option>
              {(manifest?.collections || [])
                .filter((c) => c.id !== collection?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
            {errors.parentId && (
              <Text size='1' className={styles.error}>
                {errors.parentId}
              </Text>
            )}
            <Text size='2' color='light' className={styles.hint}>
              Select a parent collection to nest this collection inside it.
            </Text>
          </div>

          <div className={styles.section}>
            <Text as='label' size='2' className={styles.sectionLabel}>
              Tags
            </Text>
            <TagSelectorField
              tags={tags}
              selectedTags={form.tagFilter.tagIds}
              onChange={(tagIds) => {
                setForm((prev) => ({
                  ...prev,
                  tagFilter: { ...prev.tagFilter, tagIds }
                }))
                if (errors.tags) setErrors({ ...errors, tags: '' })
              }}
            />
            {errors.tags && (
              <Text size='1' className={styles.error}>
                {errors.tags}
              </Text>
            )}
          </div>

          <div className={styles.section}>
            <Text as='label' size='2' className={styles.sectionLabel}>
              Filter mode
            </Text>
            <Select
              size='lg'
              value={form.tagFilter.mode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tagFilter: {
                    ...prev.tagFilter,
                    mode: e.target.value as 'any' | 'all'
                  }
                }))
              }
            >
              <option value='any'>Match ANY tag (OR)</option>
              <option value='all'>Match ALL tags (AND)</option>
            </Select>
            <Text size='2' color='light' className={styles.hint}>
              {form.tagFilter.mode === 'any'
                ? 'Bookmarks with at least one of the selected tags will appear.'
                : 'Only bookmarks that have ALL selected tags will appear.'}
            </Text>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            onClick={() => {
              navigate('/collections')
            }}
            color='black'
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={!hasChanges || isLoading}>
            {isLoading && <Loader2 className={styles.spinner} />}
            {collection ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
