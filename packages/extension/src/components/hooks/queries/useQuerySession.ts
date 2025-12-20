import { useQuery } from '@tanstack/react-query'

import {
  fetchRefreshToken,
  fetchSession,
  type RefreshTokenResponse,
  type SessionResponse
} from '@/api/auth-api'

export const QUERY_KEYS = {
  session: () => ['auth', 'session'] as const,
  refreshToken: () => ['auth', 'refreshToken'] as const
}

export const useQuerySession = () => {
  return useQuery<SessionResponse>({
    queryKey: QUERY_KEYS.session(),
    queryFn: fetchSession,
    enabled: false,
    staleTime: 0
  })
}

export const useQueryRefreshToken = () => {
  return useQuery<RefreshTokenResponse>({
    queryKey: QUERY_KEYS.refreshToken(),
    queryFn: fetchRefreshToken,
    enabled: false,
    staleTime: 0
  })
}
