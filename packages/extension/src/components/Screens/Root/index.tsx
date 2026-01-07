import { TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'

import {
  AuthSessionProvider,
  useAuthSession
} from '@/components/hooks/providers/useAuthSessionProvider'
import {
  ManifestProvider,
  useManifest
} from '@/components/hooks/providers/useManifestProvider'
import {
  NavigationProvider,
  Route,
  useNavigation
} from '@/components/hooks/providers/useNavigationProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'
import { useRouteGuard } from '@/components/hooks/useRouteGuard'
import Bookmark from '@/components/Screens/Bookmark'
import Collection from '@/components/Screens/Collection'
import Collections from '@/components/Screens/Collections'
import Login from '@/components/Screens/Login'
import PinUnlock from '@/components/Screens/PinUnlock'
import Register from '@/components/Screens/Register'
import Tag from '@/components/Screens/Tag'
import Tags from '@/components/Screens/Tags'
import Vault from '@/components/Screens/Vault'
import Text from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/lib/constants'
import { clearStorageItem, getSettings, getStorageItem } from '@/lib/storage'

import styles from './styles.module.css'

function RootContent() {
  useRouteGuard()
  const { route, flash, navigate } = useNavigation()
  const { session } = useAuthSession()
  const { manifest, isLoading: isManifestLoading, clear: clearManifest } = useManifest()

  useEffect(() => {
    const checkLockState = async () => {
      // Don't redirect during authentication flows
      if (
        route === '/login' ||
        route === '/register' ||
        route === '/pin-unlock'
      ) {
        return
      }

      // Don't check if manifest is still loading
      if (isManifestLoading) {
        return
      }

      // Check explicit locked flag (only trust the explicit flag, not missing keystore)
      if (session.userId && session.token) {
        const isLocked = await getStorageItem<boolean>(STORAGE_KEYS.IS_LOCKED)

        // Only redirect to PIN unlock if explicitly locked
        if (isLocked) {
          const settings = await getSettings()
          const pinStore = await getStorageItem(STORAGE_KEYS.PIN_STORE)

          // Only redirect if PIN is actually configured
          if (settings?.unlockMethod === 'pin' && pinStore) {
            // Clear manifest from memory if locked (it was already cleared from storage)
            if (manifest) {
              clearManifest()
            }
            navigate('/pin-unlock')
          } else {
            // IS_LOCKED is true but PIN not configured - clear the flag and force logout
            await clearStorageItem(STORAGE_KEYS.IS_LOCKED).catch(() => {})
            navigate('/login')
          }
        }
      }
    }

    checkLockState()
  }, [
    session.userId,
    session.token,
    route,
    manifest,
    isManifestLoading,
    navigate,
    clearManifest
  ])

  const renderRoute = () => {
    switch (route as Route) {
      case '/login':
        return <Login />
      case '/register':
        return <Register />
      case '/pin-unlock':
        return <PinUnlock />
      case '/vault':
        return <Vault />
      case '/bookmark':
        return <Bookmark />
      case '/tag':
        return <Tag />
      case '/tags':
        return <Tags />
      case '/collection':
        return <Collection />
      case '/collections':
        return <Collections />
      default:
        return <Bookmark />
    }
  }

  return (
    <div className={styles.container}>
      {flash && (
        <div className={styles.flash}>
          <TriangleAlert size={16} color='white' />
          <Text size='2' weight='regular' color='white'>
            {flash}
          </Text>
        </div>
      )}
      {renderRoute()}
    </div>
  )
}

/**
 * Root component that sets up all providers
 */
export default function Root() {
  return (
    <SettingsProvider>
      <AuthSessionProvider>
        <ManifestProvider>
          <NavigationProvider>
            <RootContent />
          </NavigationProvider>
        </ManifestProvider>
      </AuthSessionProvider>
    </SettingsProvider>
  )
}
