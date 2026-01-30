import { createSignal } from 'solid-js'
import { authClient } from '@/lib/auth-client'

import AdULogo from '@/adulogo.png'

export const LandingPage = () => {
  const [isLoading, setIsLoading] = createSignal(false)
  const logIn = async () => {
    await authClient.signIn.social(
      {
        provider: 'microsoft',
        callbackURL: '/',
      },
      {
        onRequest: (_) => {
          setIsLoading(true)
        },
        onError: (ctx) => {
          alert(ctx.error.message)
        },
      },
    )

    setIsLoading(false)
  }

  return (
    <div class="hero bg-base-200 min-h-screen">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">Welcome to AdU-Tutor</h1>
          <p class="py-6">
            AdU-Tutor is a platform that connects students with tutors for
            online tutoring services.
          </p>
          <button
            onClick={logIn}
            classList={{ loading: isLoading() }}
            class="btn btn-primary"
          >
            <img class="w-6" src={AdULogo} alt="Adamson University logo" />
            Login with AdU Mail
          </button>
        </div>
      </div>
    </div>
  )
}
