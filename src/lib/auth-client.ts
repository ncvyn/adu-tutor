import { createAuthClient } from 'better-auth/solid'
import { useNavigate } from '@tanstack/solid-router'
import { createEffect } from 'solid-js'
import { useNotifications } from '@/lib/notifications'

export const authClient = createAuthClient()

export type AuthGuardOptions = {
  /** Require authentication (redirect if NOT logged in) */
  requireAuth?: boolean
  /** Require guest (redirect if IS logged in) */
  requireGuest?: boolean
  /** Where to redirect */
  redirectTo?: string
}

/**
 * Flexible auth guard hook
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireAuth = false, requireGuest = false, redirectTo } = options

  const session = authClient.useSession()
  const navigate = useNavigate()

  createEffect(() => {
    const { isPending, data } = session()

    if (isPending) return

    // Redirect if user should be authenticated but isn't
    if (requireAuth && !data) {
      navigate({ to: redirectTo || '/', replace: true })
    }

    // Redirect if user should be guest but is authenticated
    if (requireGuest && data) {
      navigate({ to: redirectTo || '/info-hub', replace: true })
    }
  })

  return session
}

/*
 * Sign in with BA client
 */
export async function signIn(): Promise<void> {
  const { notify } = useNotifications()

  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/app',
    })
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Signing in failed.`,
    })
  }
  notify({ type: 'success', message: 'Redirecting...' })

  await authClient.revokeOtherSessions()
}
