import { BookOpenText, Library, Settings2, Star } from 'lucide-react'

import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'

import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

import styles from './styles.module.css'

export default function Header({
  title,
  canSwitchToVault = false,
  canSwitchToBookmark = false
}: {
  title?: string
  canSwitchToVault?: boolean
  canSwitchToBookmark?: boolean
}) {
  const { navigate } = useNavigation()

  const switchToVault = () => {
    navigate('/vault')
  }

  const switchToBookmark = () => {
    navigate('/bookmark')
  }
  return (
    <div className={styles.component}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.leftIcon}>
            <Library strokeWidth={2} size={20} color='orange' />
          </div>

          <Text as='h1' size='2' weight='medium'>
            {title ? title : 'LockMark'}
          </Text>
        </div>

        <div className={styles.right}>
          {canSwitchToVault && (
            <Button onClick={switchToVault} variant='ghost'>
              <BookOpenText strokeWidth={2} size={18} color='white' />
            </Button>
          )}
          {canSwitchToBookmark && (
            <Button onClick={switchToBookmark} variant='ghost'>
              <Star strokeWidth={2} size={18} color='white' />
            </Button>
          )}

          <Button variant='ghost'>
            <Settings2 strokeWidth={2} size={18} color='white' />
          </Button>
        </div>
      </div>
    </div>
  )
}
