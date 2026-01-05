import { Edit, Folder, Trash2 } from 'lucide-react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { getIconByName } from '@/components/ui/IconPicker'
import type { Collection } from '@/lib/types'

import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

type CollectionCardProps = {
  collection: Collection
  bookmarkCount: number
  onDelete?: (id: string) => void
  depth?: number
}

export function CollectionCard({
  collection,
  bookmarkCount,
  onDelete,
  depth = 0
}: CollectionCardProps) {
  const { navigate } = useNavigation()

  const Icon = collection.icon ? getIconByName(collection.icon) : Folder

  return (
    <div
      className={styles.component}
      style={{ paddingLeft: `${depth * 20}px` }}
    >
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.collectionInfo}>
            <Icon size={16} className={styles.icon} />
            <Text size='2' weight='medium' className={styles.name}>
              {collection.name}
            </Text>
            {bookmarkCount > 0 && (
              <span className={styles.badge}>{bookmarkCount}</span>
            )}
          </div>
          <div className={styles.tagInfo}>
            <Text size='1' color='light'>
              {collection.tagFilter.tagIds.length} tag
              {collection.tagFilter.tagIds.length !== 1 ? 's' : ''} •{' '}
              {collection.tagFilter.mode === 'any' ? 'Match any' : 'Match all'}
            </Text>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            asIcon={true}
            color='dark'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate('/collection', { collection: collection.id })
            }}
            title='Edit'
          >
            <Edit size={16} />
          </Button>
          {onDelete && (
            <Button
              asIcon={true}
              color='dark'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(collection.id)
              }}
              title='Delete'
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
