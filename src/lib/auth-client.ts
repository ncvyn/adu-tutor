import { createAuthClient } from 'better-auth/solid'

export const authClient = createAuthClient()

type AuthError = {
  code: string
  statusText?: string
  message?: string
}

type AuthResult =
  | { success: true; session?: any }
  | {
      success: false
      error: AuthError
    }

export async function logIn(): Promise<AuthResult> {
  let failure: AuthError | null = null

  await authClient.signIn.social(
    {
      provider: 'microsoft',
      callbackURL: '/',
    },
    {
      onError: (ctx) => {
        failure = {
          code: ctx.error.code,
          statusText: ctx.error.statusText,
          message: ctx.error.message,
        }
      },
    },
  )

  if (failure) {
    return { success: false, error: failure }
  }

  await authClient.revokeOtherSessions()
  return { success: true }
}
