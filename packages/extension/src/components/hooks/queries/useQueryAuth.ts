import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchLogin, type LoginInput, type LoginResponse } from '@/api/auth-api'
import { ApiError } from '@/lib/api'

export const QUERY_KEYS = {
  login: () => ['auth', 'login'] as const
}

export const useQueryAuth = () => {
  const queryClient = useQueryClient()

  const login = useMutation<LoginResponse, ApiError, LoginInput>({
    mutationKey: QUERY_KEYS.login(),
    mutationFn: fetchLogin,
    onSuccess: async (data) => {
      console.log('login success', data)
      // Store session in background service worker
      //     await sessionManager.setSession({
      //       token: data.token,
      //       userId: data.user_id,
      //       expiresAt: data.expires_at
      //     })
      //     // Store sensitive auth data in memory
      //     authStore.setKdf(data.kdf)
      //     authStore.setWrappedMk(data.wrapped_mk)
      //     // Prefetch vault data
      //     await prefetchVaultData(queryClient)
    }
  })

  return {
    login
  }
}
