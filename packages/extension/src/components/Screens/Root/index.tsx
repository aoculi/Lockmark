import {
  NavigationProvider,
  useNavigation
} from '@/components/hooks/providers/useNavigationProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'

import Text from '@/components/ui/Text'
import Login from '../Login'
import Register from '../Register'

import styles from './styles.module.css'

// -----------------------------------------------------------------------------
// HOW TO USE SETTINGS IN A CHILD COMPONENT:
// -----------------------------------------------------------------------------
// import { useSettings } from '@/components/hooks/providers/useSettingsProvider'
//
// function MyComponent() {
//   const { settings, isLoading, updateSettings, setShowHiddenTags, setApiUrl, setAutoLockTimeout } = useSettings()
//
//   // Access settings values
//   console.log(settings.showHiddenTags)
//   console.log(settings.apiUrl)
//   console.log(settings.autoLockTimeout)
//
//   // Update a single setting
//   await setShowHiddenTags(true)
//   await setApiUrl('https://api.example.com')
//   await setAutoLockTimeout('30min')
//
//   // Update multiple settings at once
//   await updateSettings({ showHiddenTags: true, apiUrl: 'https://api.example.com' })
//
//   // Check loading state
//   if (isLoading) return <div>Loading...</div>
//
//   return <div>...</div>
// }
// -----------------------------------------------------------------------------

/**
 * Inner content component that consumes the navigation context
 */
function RootContent() {
  const { route, flash, setFlash, navigate } = useNavigation()

  const handleLoginSuccess = () => {
    setFlash(null)
    navigate('/vault')
  }

  const handleRegisterSuccess = () => {
    setFlash(null)
    navigate('/vault')
  }

  const renderRoute = () => {
    switch (route) {
      case '/login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      case '/register':
        return <Register onRegisterSuccess={handleRegisterSuccess} />
      case '/vault':
      default:
        return <div>Vault</div>
    }
  }

  return (
    <>
      {flash && (
        <div className={styles.flash}>
          <Text align='center' size='2' weight='regular' color='light'>
            {flash}
          </Text>
        </div>
      )}
      {renderRoute()}
    </>
  )
}

/**
 * Root component that sets up all providers
 */
export default function Root() {
  return (
    <SettingsProvider>
      <NavigationProvider>
        <RootContent />
      </NavigationProvider>
    </SettingsProvider>
  )
}
