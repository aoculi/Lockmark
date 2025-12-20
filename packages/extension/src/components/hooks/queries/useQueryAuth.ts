import { useMutation } from '@tanstack/react-query'

import { fetchLogin, type LoginInput, type LoginResponse } from '@/api/auth-api'
import { useAuthSession } from '@/components/hooks/providers/useAuthSessionProvider'
import { ApiError } from '@/lib/api'
import useQueryVault from './useQueryVault'

export const QUERY_KEYS = {
  login: () => ['auth', 'login'] as const
}

export const useQueryAuth = () => {
  const { setSession } = useAuthSession()
  const { prefetchVaultManifest } = useQueryVault()

  const login = useMutation<LoginResponse, ApiError, LoginInput>({
    mutationKey: QUERY_KEYS.login(),
    mutationFn: fetchLogin,
    onSuccess: async (data) => {
      setSession(data)
      await prefetchVaultManifest()
    }
  })

  return {
    login
  }
}
