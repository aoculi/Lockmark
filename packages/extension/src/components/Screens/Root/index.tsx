import { AuthSessionProvider } from '@/components/hooks/providers/useAuthSessionProvider'
import {
  NavigationProvider,
  Route,
  useNavigation
} from '@/components/hooks/providers/useNavigationProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'

import Text from '@/components/ui/Text'
import Bookmark from '../Bookmark'
import Bookmarks from '../Bookmarks'
import Login from '../Login'
import Register from '../Register'

import styles from './styles.module.css'

function RootContent() {
  const { route, flash, setFlash, navigate } = useNavigation()

  const handleLoginSuccess = () => {
    setFlash(null)
    navigate('/bookmark')
  }

  const handleRegisterSuccess = () => {
    setFlash(null)
    navigate('/bookmark')
  }

  const renderRoute = () => {
    switch (route as Route) {
      case '/login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      case '/register':
        return <Register onRegisterSuccess={handleRegisterSuccess} />
      case '/vault':
        return <Bookmarks />
      case '/bookmark':
        return <Bookmark />
      default:
        return <Bookmark />
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
      <AuthSessionProvider>
        <NavigationProvider>
          <RootContent />
        </NavigationProvider>
      </AuthSessionProvider>
    </SettingsProvider>
  )
}
