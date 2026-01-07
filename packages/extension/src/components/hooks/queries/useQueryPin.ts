/**
 * React Query hooks for PIN operations
 */

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import {
  useManifest,
  type StoredManifestData
} from '@/components/hooks/providers/useManifestProvider'
import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { STORAGE_KEYS } from '@/lib/constants'
import { getLockState } from '@/lib/lockState'
import type { LockState } from '@/lib/storage'
import { getStorageItem } from '@/lib/storage'
import { unlockWithPin } from '@/lib/unlock'

export const QUERY_KEYS = {
  unlockWithPin: () => ['pin', 'unlock'] as const
}

export type PinPhase = 'idle' | 'verifying' | 'unlocking' | 'loading'

export const useQueryPin = () => {
  const { setManifestFromLogin } = useManifest()
  const { setFlash } = useNavigation()
  const [phase, setPhase] = useState<PinPhase>('idle')
  const [lockState, setLockState] = useState<LockState | null>(null)

  const unlockWithPinMutation = useMutation({
    mutationKey: QUERY_KEYS.unlockWithPin(),
    retry: false,
    onMutate: async () => {
      setFlash(null)
      const state = await getLockState()
      setLockState(state)
    },
    mutationFn: async (pin: string) => {
      // Phase 1: Verify PIN and decrypt MAK
      setPhase('verifying')
      const result = await unlockWithPin(pin)

      // Phase 2: Load manifest from storage
      setPhase('loading')
      const manifestData =
        await getStorageItem<StoredManifestData>(STORAGE_KEYS.MANIFEST)
      if (manifestData) {
        setManifestFromLogin(manifestData)
      }

      setPhase('idle')
      return result
    },
    onError: async () => {
      setPhase('idle')
      const state = await getLockState()
      setLockState(state)
    },
    onSuccess: () => {
      setPhase('idle')
    }
  })

  return {
    unlockWithPin: unlockWithPinMutation,
    phase,
    lockState
  }
}
