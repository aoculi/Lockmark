import { Plus } from 'lucide-react'

import Menu from '@/components/parts/Menu'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

export default function TagHeader({ onAddTag }: { onAddTag: () => void }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Menu isConnected={true} />

        <div>
          <Text
            size='3'
            as='span'
            color='white'
            weight='medium'
            style={{ marginRight: '4px' }}
          >
            Lock
          </Text>
          <Text size='3' as='span' color='primary' weight='medium'>
            Mark
          </Text>
        </div>
      </div>

      <Button
        onClick={onAddTag}
        asIcon={true}
        size='sm'
        color='primary'
        variant='solid'
      >
        <Plus strokeWidth={1} size={18} />
      </Button>
    </div>
  )
}
