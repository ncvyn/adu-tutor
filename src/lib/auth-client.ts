import { createAuthClient } from 'better-auth/solid'
import { useNavigate } from '@tanstack/solid-router'
import { createEffect, createSignal } from 'solid-js'
import type { AppNotification } from '@/lib/notifications'

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
  const [hasRedirected, setHasRedirected] = createSignal(false)

  createEffect(() => {
    const { isPending, data } = session()

    if (isPending || hasRedirected()) return

    // Redirect if user should be authenticated but isn't
    if (requireAuth && !data) {
      setHasRedirected(true)
      navigate({ to: redirectTo || '/', replace: true })
    }

    // Redirect if user should be guest but is authenticated
    if (requireGuest && data) {
      setHasRedirected(true)
      navigate({ to: redirectTo || '/info-hub', replace: true })
    }
  })

  return session
}

/*
 * Sign in with BA client
 */
export async function signIn(
  notify: (notification: Omit<AppNotification, 'id'>) => string,
): Promise<void> {
  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/info-hub',
    })

    notify({ type: 'success', message: 'Redirecting...' })
    await authClient.revokeOtherSessions()
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Signing in failed.`,
    })
  }
}

/*
 * Sign out with BA client
 */
export async function signOut(
  notify: (notification: Omit<AppNotification, 'id'>) => string,
): Promise<void> {
  const navigate = useNavigate()

  try {
    await authClient.signOut()
    notify({ type: 'success', message: 'Redirecting...' })
    navigate({ to: '/', replace: true })
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Signing out failed.`,
    })
  }
}
