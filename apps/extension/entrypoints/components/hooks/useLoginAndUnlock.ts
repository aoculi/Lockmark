import { useMutation } from '@tanstack/react-query'

import type { ApiError } from '@/entrypoints/lib/api'
import { useLogin } from './useLogin'
import { usePostAuthFlow } from './usePostAuthFlow'

export type LoginInput = {
  login: string
  password: string
}

export function useLoginAndUnlock() {
  const loginMutation = useLogin()
  const postAuthFlow = usePostAuthFlow()

  return useMutation<
    {
      loginData: any
      unlockData: { success: boolean; isFirstUnlock: boolean }
    },
    ApiError,
    LoginInput
  >({
    mutationKey: ['auth', 'loginAndUnlock'],
    mutationFn: async (input: LoginInput) => {
      // First perform login
      const loginData = await loginMutation.mutateAsync(input)

      // Then perform unlock and manifest loading
      const unlockData = await postAuthFlow.mutateAsync({
        password: input.password,
        userId: loginData.user_id,
        vaultId: loginData.user_id
      })

      return { loginData, unlockData }
    }
  })
}
