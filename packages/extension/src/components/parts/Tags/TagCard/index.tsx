import { Edit, Tag as TagIcon, Trash2 } from 'lucide-react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { getTagColor } from '@/lib/bookmarkUtils'
import type { Tag } from '@/lib/types'

import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type TagCardProps = {
  tag?: Tag
  tags: Tag[]
  bookmarkCount: number
  onDelete?: (id: string) => void
  showActions?: boolean
  iconColor?: string
}

export function TagCard({
  tag,
  tags,
  bookmarkCount,
  onDelete,
  showActions = true,
  iconColor
}: TagCardProps) {
  const { navigate } = useNavigation()
  const colorInfo = tag ? getTagColor(tag.id, tags) : null
  const displayName = tag?.name || 'Untitled'
  const color = iconColor || colorInfo?.tagColor || 'inherit'

  return (
    <div className={styles.component}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.tagInfo}>
            <TagIcon
              size={16}
              style={{
                color: color,
                flexShrink: 0
              }}
            />
            <Text
              size='2'
              weight='medium'
              className={styles.name}
              style={{
                color: color
              }}
            >
              {displayName}
            </Text>
            {bookmarkCount > 0 && (
              <span className={styles.badge}>{bookmarkCount}</span>
            )}
          </div>
        </div>

        {showActions && tag && onDelete && (
          <div className={styles.actions}>
            <Button
              asIcon={true}
              color='dark'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate('/tag', { tag: tag.id })
              }}
              title='Edit'
            >
              <Edit size={16} />
            </Button>
            <Button
              asIcon={true}
              color='dark'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(tag.id)
              }}
              title='Delete'
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
