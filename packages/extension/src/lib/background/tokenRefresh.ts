import type { Session } from '@/lib/background/session'
import { MIN_REFRESH_INTERVAL } from '@/lib/constants'
import type { Settings } from '@/lib/storage'
import { getDefaultSettings, getSettings } from '@/lib/storage'

export class TokenRefresh {
  private lastRefreshAttempt: number = 0
  private refreshInProgress: Promise<void> | null = null

  /**
   * Attempt to refresh JWT token if needed
   * - Throttles refresh attempts (max once per minute)
   * - Returns existing promise if refresh is already in progress
   */
  async attemptTokenRefresh(
    session: Session | null,
    setSession: (session: Session) => void
  ): Promise<void> {
    if (!session) {
      return
    }

    const now = Date.now()

    if (now - this.lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
      if (this.refreshInProgress) {
        return this.refreshInProgress
      }
      return
    }

    if (this.refreshInProgress) {
      return this.refreshInProgress
    }

    this.lastRefreshAttempt = now

    this.refreshInProgress = (async () => {
      try {
        const settingsResult: Settings =
          (await getSettings()) || getDefaultSettings()

        if (!settingsResult?.apiUrl || settingsResult.apiUrl.trim() === '') {
          return
        }

        const apiUrl = settingsResult.apiUrl.trim()
        const refreshUrl = `${apiUrl}/auth/refresh`

        const response = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'omit',
          mode: 'cors'
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (data.token && typeof data.expires_at === 'number') {
          setSession({
            token: data.token,
            userId: session.userId,
            expiresAt: data.expires_at
          })
        }
      } catch (error) {
        console.log('Token refresh failed:', error)
      } finally {
        this.refreshInProgress = null
      }
    })()

    return this.refreshInProgress
  }
}
