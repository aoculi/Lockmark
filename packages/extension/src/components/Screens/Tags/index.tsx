import { useState } from 'react'

import usePopupSize from '@/components/hooks/usePopupSize'

import Header from '@/components/parts/Header'
import TagHeader from '@/components/parts/Tags/TagHeader'
import TagList from '@/components/parts/Tags/TagList'

import styles from './styles.module.css'

type SortMode = 'alphabetical' | 'bookmarkCount'

export default function Tags() {
  usePopupSize('compact')
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical')

  return (
    <div className={styles.component}>
      <Header title='Tags' canSwitchToVault={true} />
      <div className={styles.content}>
        <TagHeader sortMode={sortMode} onSortModeChange={setSortMode} />
        <TagList sortMode={sortMode} />
      </div>
    </div>
  )
}
