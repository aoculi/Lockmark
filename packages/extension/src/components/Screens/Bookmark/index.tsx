import { useAuthSession } from '@/components/hooks/providers/useAuthSessionProvider'
import { STORAGE_KEYS } from '@/lib/constants'
import { getStorageItem } from '@/lib/storage'
import { ManifestV1 } from '@/lib/types'

import Header from '@/components/parts/Header'
import Button from '@/components/ui/Button'

import usePopupSize from '@/components/hooks/usePopupSize'
import styles from './styles.module.css'

export default function Bookmark() {
  const { clearSession } = useAuthSession()
  usePopupSize('compact')

  const getManifest = async () => {
    const manifest = await getStorageItem<ManifestV1>(STORAGE_KEYS.MANIFEST)
    console.log('get manifest', manifest)
  }
  getManifest()

  return (
    <div className={styles.component}>
      <Header title='New' canSwitchToVault={true} />
      <Button onClick={() => clearSession()}>Logout</Button>
      <div>POPUP ADD BOOKMARK</div>
    </div>
  )
}
