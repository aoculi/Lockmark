import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
import { useQueryAuth } from '@/components/hooks/queries/useQueryAuth'

import AuthForm from '@/components/AuthForm'

export default function Login() {
  const { login, phase } = useQueryAuth()
  const { navigate } = useNavigation()

  return (
    <AuthForm
      title="Sign In"
      defaultButtonLabel="Unlock Vault"
      linkText="Not registered? Create an account"
      onLinkClick={() => navigate('/register')}
      mutation={login}
      phase={phase}
    />
  )
}
