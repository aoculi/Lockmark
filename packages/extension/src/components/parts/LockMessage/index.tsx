import { Lock } from 'lucide-react'

import Text from '@/components/ui/Text'

import styles from './styles.module.css'

export default function LockMessage({
  canUnlockWithPin
}: {
  canUnlockWithPin: boolean
}) {
  return (
    <div className={styles.component}>
      <div className={styles.lockScreen}>
        <div className={styles.lockContent}>
          <Lock size={32} strokeWidth={1.5} />
          <Text size='4' weight='medium'>
            Your LockMark session is locked.
          </Text>
          <Text size='2' color='light'>
            {canUnlockWithPin
              ? 'Unlock with your PIN to access your bookmarks.'
              : 'Please log in to access your bookmarks.'}
          </Text>
        </div>
      </div>
    </div>
  )
}
