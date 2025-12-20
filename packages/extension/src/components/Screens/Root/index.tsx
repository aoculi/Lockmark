import {
  AuthSessionProvider,
  useAuthSession
} from '@/components/hooks/providers/useAuthSessionProvider'
import {
  NavigationProvider,
  useNavigation
} from '@/components/hooks/providers/useNavigationProvider'
import { SettingsProvider } from '@/components/hooks/providers/useSettingsProvider'

import Text from '@/components/ui/Text'
import Login from '../Login'
import Register from '../Register'

import Button from '@/components/ui/Button'
import styles from './styles.module.css'

function RootContent() {
  const { route, flash, setFlash, navigate } = useNavigation()
  const { clearSession } = useAuthSession()

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
        return (
          <div>
            Vault
            <Button onClick={() => clearSession()}>Logout</Button>
          </div>
        )
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
