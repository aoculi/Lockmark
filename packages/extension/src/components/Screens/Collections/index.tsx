import { useState } from 'react'

import usePopupSize from '@/components/hooks/usePopupSize'

import CollectionHeader from '@/components/parts/Collections/CollectionHeader'
import CollectionList from '@/components/parts/Collections/CollectionList'
import Header from '@/components/parts/Header'

import styles from './styles.module.css'

type SortMode = 'alphabetical' | 'bookmarkCount'

export default function Collections() {
  usePopupSize('compact')
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical')

  return (
    <div className={styles.component}>
      <Header title='Collections' canSwitchToVault={true} />
      <div className={styles.content}>
        <CollectionHeader sortMode={sortMode} onSortModeChange={setSortMode} />
        <CollectionList sortMode={sortMode} />
      </div>
    </div>
  )
}
