import { createAuthClient } from 'better-auth/solid'
import { useNavigate } from '@tanstack/solid-router'
import { createEffect, createMemo, createSignal } from 'solid-js'
import type { AppNotification } from '@/components'

export const authClient = createAuthClient()

type AuthGuardOptions = {
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

  const sessionState = createMemo(() => {
    const currentSession = session()
    return {
      isPending: currentSession.isPending,
      userId: currentSession.data?.user.id ?? null,
      isAuthenticated: !!currentSession.data,
    }
  })

  createEffect(() => {
    const { isPending, isAuthenticated } = sessionState()

    if (isPending || hasRedirected()) return

    const target =
      requireAuth && !isAuthenticated
        ? redirectTo || '/'
        : requireGuest && isAuthenticated
          ? redirectTo || '/info-hub'
          : null

    if (!target) return

    setHasRedirected(true)
    queueMicrotask(() => {
      void navigate({ to: target, replace: true })
    })
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
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Signing in failed with error ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

/*
 * Sign out with BA client
 */
export async function signOut(
  notify: (notification: Omit<AppNotification, 'id'>) => string,
  navigate: (options: { to: string; replace?: boolean }) => Promise<void>,
): Promise<void> {
  try {
    await authClient.signOut()
    notify({ type: 'success', message: 'Redirecting...' })
    await navigate({ to: '/', replace: true })
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Signing out failed with error ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}
