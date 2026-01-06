import { ArrowUpDown, ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { type CollectionSortMode } from '@/lib/collectionUtils'

import Button from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'

import styles from './styles.module.css'

export default function CollectionHeader({
  sortMode,
  onSortModeChange
}: {
  sortMode: CollectionSortMode
  onSortModeChange: (mode: CollectionSortMode) => void
}) {
  const { navigate } = useNavigation()
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <div className={styles.container}>
      <div className={styles.actionsContainer}>
        <DropdownMenu.Root open={sortOpen} onOpenChange={setSortOpen}>
          <DropdownMenu.Trigger asChild>
            <Button
              size='sm'
              variant='ghost'
              color='light'
              className={styles.actionButton}
              title='Sort collections'
            >
              <ArrowUpDown strokeWidth={2} size={16} />
              <span className={styles.actionLabel}>Sort</span>
              <ChevronDown
                strokeWidth={2}
                size={14}
                className={`${styles.chevron} ${sortOpen ? styles.chevronOpen : ''}`}
              />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              onClick={() => onSortModeChange('alphabetical')}
              disabled={sortMode === 'alphabetical'}
            >
              Alphabetically
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => onSortModeChange('bookmarkCount')}
              disabled={sortMode === 'bookmarkCount'}
            >
              Bookmark count
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <Button
          asIcon={true}
          color='light'
          onClick={() => navigate('/collection')}
          size='sm'
          title='Create a new collection'
        >
          <Plus strokeWidth={2} size={16} />
        </Button>
      </div>
    </div>
  )
}
