import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import { useQueryVault } from '@/components/hooks/queries/useQueryVault'
import { STORAGE_KEYS } from '@/lib/constants'
import { clearStorageItem, getStorageItem, setStorageItem } from '@/lib/storage'
import type { ManifestV1 } from '@/lib/types'

export type StoredManifestData = {
  manifest: ManifestV1
  etag: string | null
  serverVersion: number
}

export async function loadManifestData(): Promise<StoredManifestData | null> {
  const stored = await getStorageItem<StoredManifestData>(STORAGE_KEYS.MANIFEST)
  if (stored?.manifest) {
    return stored
  }

  const oldManifest = await getStorageItem<ManifestV1>(STORAGE_KEYS.MANIFEST)
  if (oldManifest && 'items' in oldManifest) {
    const oldMeta = await getStorageItem<{ etag: string; version: number }>(
      'manifest_meta'
    ).catch(() => null)
    return {
      manifest: oldManifest,
      etag: oldMeta?.etag ?? null,
      serverVersion: oldMeta?.version ?? oldManifest.version ?? 0
    }
  }

  return null
}

export async function saveManifestData(
  data: StoredManifestData
): Promise<void> {
  await setStorageItem(STORAGE_KEYS.MANIFEST, data)
}

type ManifestContextType = {
  manifest: ManifestV1 | null
  isLoading: boolean
  isSaving: boolean
  save: (updatedManifest: ManifestV1) => Promise<{
    manifest: ManifestV1
    etag: string
    version: number
  }>
  reload: () => Promise<void>
  clear: () => void
  setManifestFromLogin: (data: StoredManifestData) => void
}

const ManifestContext = createContext<ManifestContextType | null>(null)

export function useManifest() {
  const context = useContext(ManifestContext)
  if (!context) {
    throw new Error('useManifest must be used within a ManifestProvider')
  }
  return context
}

type ManifestProviderProps = {
  children: ReactNode
}

export function ManifestProvider({ children }: ManifestProviderProps) {
  const { saveManifest: saveManifestMutation } = useQueryVault()

  const [manifest, setManifest] = useState<ManifestV1 | null>(null)
  const [etag, setEtag] = useState<string | null>(null)
  const [serverVersion, setServerVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadManifest = useCallback(async () => {
    try {
      const data = await loadManifestData()
      if (data) {
        setManifest(data.manifest)
        setEtag(data.etag)
        setServerVersion(data.serverVersion)
      } else {
        setManifest(null)
        setEtag(null)
        setServerVersion(0)
      }
    } catch (error) {
      console.error('Failed to load manifest from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadManifest()
  }, [loadManifest])

  const clear = useCallback(() => {
    setManifest(null)
    setEtag(null)
    setServerVersion(0)
    clearStorageItem(STORAGE_KEYS.MANIFEST).catch(() => {})
  }, [])

  /**
   * Save an updated manifest to server and storage
   */
  const save = useCallback(
    async (updatedManifest: ManifestV1) => {
      if (!manifest) {
        throw new Error('Cannot save: manifest not loaded')
      }

      const result = await saveManifestMutation.mutateAsync({
        manifest: updatedManifest,
        etag,
        serverVersion,
        baseSnapshot: manifest
      })

      try {
        await saveManifestData({
          manifest: result.manifest,
          etag: result.etag,
          serverVersion: result.version
        })
      } catch (error) {
        console.error('Failed to save manifest to local storage:', error)
      }

      setManifest({ ...result.manifest })
      setEtag(result.etag)
      setServerVersion(result.version)

      return result
    },
    [manifest, etag, serverVersion, saveManifestMutation]
  )

  const reload = useCallback(async () => {
    await loadManifest()
  }, [loadManifest])

  const setManifestFromLogin = useCallback((data: StoredManifestData) => {
    setManifest(data.manifest)
    setEtag(data.etag)
    setServerVersion(data.serverVersion)
    setIsLoading(false)
  }, [])

  const contextValue: ManifestContextType = {
    manifest,
    isLoading,
    isSaving: saveManifestMutation.isPending,
    save,
    reload,
    clear,
    setManifestFromLogin
  }

  return (
    <ManifestContext.Provider value={contextValue}>
      {children}
    </ManifestContext.Provider>
  )
}
