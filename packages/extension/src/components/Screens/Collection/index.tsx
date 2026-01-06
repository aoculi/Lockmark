import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useCollections } from '@/components/hooks/useCollections'
import usePopupSize from '@/components/hooks/usePopupSize'
import { wouldCreateCircularReference } from '@/lib/collectionUtils'

import Header from '@/components/parts/Header'
import Button from '@/components/ui/Button'
import IconPicker from '@/components/ui/IconPicker'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type FormState = {
  name: string
  icon?: string
  parentId?: string
}

const defaultForm: FormState = {
  name: '',
  icon: undefined,
  parentId: undefined
}

export default function Collection() {
  usePopupSize('compact')
  const { collections, createCollection, updateCollection } = useCollections()
  const { navigate, selectedCollection, setFlash } = useNavigation()

  const existingCollection = useMemo(
    () => collections.find((c) => c.id === selectedCollection) || null,
    [collections, selectedCollection]
  )

  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (existingCollection) {
      setForm({
        name: existingCollection.name,
        icon: existingCollection.icon,
        parentId: existingCollection.parentId
      })
    }
  }, [existingCollection])

  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (
      wouldCreateCircularReference(
        collections,
        existingCollection?.id || null,
        form.parentId
      )
    ) {
      newErrors.parentId = 'Would create a circular reference'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isLoading) return

    setIsLoading(true)

    try {
      if (existingCollection) {
        // Update existing
        await updateCollection(existingCollection.id, {
          name: form.name,
          icon: form.icon,
          parentId: form.parentId
        })
      } else {
        // Create new
        await createCollection({
          name: form.name,
          icon: form.icon,
          parentId: form.parentId
        })
      }

      navigate('/collections')
    } catch (error) {
      setFlash(`Failed to save: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!form.name.trim()) return false
    if (!existingCollection) return true

    return (
      form.name.trim() !== existingCollection.name ||
      form.icon !== existingCollection.icon ||
      form.parentId !== existingCollection.parentId
    )
  }, [form, existingCollection])

  return (
    <div className={styles.component}>
      <Header
        title={existingCollection ? 'Edit collection' : 'New collection'}
        canSwitchToVault
      />

      <div className={styles.page}>
        <div className={styles.content}>
          <Input
            error={errors.name}
            size='lg'
            type='text'
            placeholder='Collection name'
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
          />

          <div className={styles.section}>
            <Text as='label' size='2' className={styles.sectionLabel}>
              Icon
            </Text>
            <IconPicker
              value={form.icon}
              onChange={(icon) => updateForm('icon', icon)}
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
              onChange={(e) =>
                updateForm('parentId', e.target.value || undefined)
              }
            >
              <option value=''>None (root level)</option>
              {collections
                .filter((c) => c.id !== existingCollection?.id)
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
              Nest this collection inside another.
            </Text>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={() => navigate('/collections')} color='black'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isLoading}>
            {isLoading && <Loader2 className={styles.spinner} />}
            {existingCollection ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
