import { createAuthClient } from 'better-auth/solid'
import { useNotifications } from '@/lib/notifications'
const { notify } = useNotifications()

export const authClient = createAuthClient()

export async function signIn() {
  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/app',
    })
  } catch (error) {
    notify({
      type: 'error',
      message: `Error! Logging in failed.`,
    })
  }
  notify({ type: 'success', message: 'Redirecting...' })

  await authClient.revokeOtherSessions()
  return { success: true }
}
