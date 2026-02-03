import { createAuthClient } from 'better-auth/solid'

export const authClient = createAuthClient()

type AuthError = {
  message: string
}

type AuthResult =
  | { success: true; session?: any }
  | {
      success: false
      error: AuthError
    }

export async function logIn(): Promise<AuthResult> {
  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/app',
    })
  } catch (error) {
    const err: AuthError = {
      message: 'Logged in failed',
    }
    return { success: false, error: err }
  }

  await authClient.revokeOtherSessions()
  return { success: true }
}
