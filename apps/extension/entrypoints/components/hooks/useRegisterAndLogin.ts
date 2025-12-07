import { useMutation } from '@tanstack/react-query'

import type { ApiError } from '@/entrypoints/lib/api'
import { useLogin } from './useLogin'
import { usePostAuthFlow } from './usePostAuthFlow'
import { useRegister } from './useRegister'

export type RegisterInput = {
  login: string
  password: string
}

export function useRegisterAndLogin() {
  const registerMutation = useRegister()
  const loginMutation = useLogin()
  const postAuthFlow = usePostAuthFlow()

  return useMutation<
    {
      registerData: any
      loginData: any
      unlockData: { success: boolean; isFirstUnlock: boolean }
    },
    ApiError,
    RegisterInput
  >({
    mutationKey: ['auth', 'registerAndLogin'],
    mutationFn: async (input: RegisterInput) => {
      try {
        // First perform registration
        const registerData = await registerMutation.mutateAsync(input)

        // Then perform login using the useLogin hook
        // Note: useLogin's onSuccess callback handles session, auth store, and prefetch
        const loginResponse = await loginMutation.mutateAsync(input)

        // Then perform unlock and manifest loading
        const unlockData = await postAuthFlow.mutateAsync({
          password: input.password,
          userId: loginResponse.user_id,
          vaultId: loginResponse.user_id
        })

        return { registerData, loginData: loginResponse, unlockData }
      } catch (error) {
        console.error('Registration and login flow error:', error)
        throw error
      }
    }
  })
}
