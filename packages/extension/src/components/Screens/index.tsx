import { useAuthGate } from '@/components/hooks/useAuthGate'
import { NavigationContext } from '@/components/hooks/useNavigation'
import { useUnauthorizedListener } from '@/components/hooks/useUnauthorizedListener'

import { SettingsModal } from '@/components/parts/Settings/SettingsModal'
import Login from '@/components/Screens/Login'
import Register from '@/components/Screens/Register'
import Vault from '@/components/Screens/Vault'

import styles from './styles.module.css'

export default function Screens() {
  const {
    route,
    isChecking,
    flash,
    isSettingsOpen,
    navigate,
    setRoute,
    setFlash,
    setIsSettingsOpen,
    openSettings,
    handleLoginSuccess,
    handleRegisterSuccess
  } = useAuthGate()

  // Listen for auth events (keystore locked, session expired, etc.)
  useUnauthorizedListener(() => {
    setRoute((currentRoute) => {
      // Don't redirect if already on login or register
      if (currentRoute === '/vault') {
        setFlash('Vault locked - please login again')
        return '/login'
      }
      // Stay on current route if already on login/register
      return currentRoute
    })
  })

  if (isChecking) {
    return (
      <div className={styles.container}>
        <p>Checking session...</p>
      </div>
    )
  }

  const renderRoute = () => {
    switch (route) {
      case '/login':
        return <Login onLoginSuccess={handleLoginSuccess} />
      case '/register':
        return <Register onRegisterSuccess={handleRegisterSuccess} />
      case '/vault':
      default:
        return <Vault />
    }
  }

  return (
    <NavigationContext.Provider value={{ navigate, setFlash, openSettings }}>
      <div className={styles.container}>
        {flash && <div className={styles.flash}>{flash}</div>}
        {renderRoute()}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </NavigationContext.Provider>
  )
}
