import { EllipsisVertical } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
  getBookmarkIdFromDrop,
  handleTagDragOver,
  isDragLeavingElement
} from '@/lib/dragAndDrop'

import Button from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type TagProps = {
  name: string
  count: number
  all: boolean
  active: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
  icon: React.ReactNode
  color: string | null
  tagId?: string
  onAssignTag?: (bookmarkId: string, tagId: string) => Promise<void>
}

export default function Tag({
  name,
  count,
  all = false,
  active = false,
  onClick,
  onEdit,
  onDelete,
  icon,
  color,
  tagId,
  onAssignTag
}: TagProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (handleTagDragOver(e, all, tagId)) {
        setIsDragOver(true)
      }
    },
    [all, tagId]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (handleTagDragOver(e, all, tagId)) {
        setIsDragOver(true)
      } else {
        setIsDragOver(false)
      }
    },
    [all, tagId]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (isDragLeavingElement(e, e.currentTarget as HTMLElement)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (all || !tagId || !onAssignTag) return

      const bookmarkId = getBookmarkIdFromDrop(e)
      if (bookmarkId) {
        try {
          await onAssignTag(bookmarkId, tagId)
        } catch (error) {
          console.error('Failed to assign tag:', error)
        }
      }
    },
    [all, tagId, onAssignTag]
  )

  const tagClassName = [
    styles.tag,
    active ? styles.active : styles.inactive,
    isDragOver ? styles.dragOver : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.tagWrapper}>
      <a
        className={tagClassName}
        href='#'
        onClick={onClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.tagIconLabelWrapper}>
          {icon}
          <div className={styles.tagLabel}>
            <Text size='2' style={{ color: color ?? 'inherit' }}>
              {name}
            </Text>
          </div>
        </div>
        <div className={`${styles.tagEnd} ${!all ? styles.countItem : ''}`}>
          <Text size='2' weight='medium' color='light'>
            {count}
          </Text>
        </div>
      </a>

      {!all && (onEdit || onDelete) && (
        <div className={styles.dropdownMenu}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button asIcon={true} color='dark' variant='ghost' size='sm'>
                <EllipsisVertical size={16} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {onEdit && (
                <DropdownMenu.Item onClick={onEdit}>Edit</DropdownMenu.Item>
              )}
              {onEdit && onDelete && <DropdownMenu.Separator />}
              {onDelete && (
                <DropdownMenu.Item onClick={onDelete} color='red'>
                  Delete
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      )}
    </div>
  )
}
