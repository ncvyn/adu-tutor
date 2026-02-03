import { createFileRoute } from '@tanstack/solid-router'
import { createSignal } from 'solid-js'
import { logIn } from '@/lib/auth-client'
import { useNotifications } from '@/lib/notifications'

import AdULogo from '@/adulogo.png'

export const Route = createFileRoute('/')({ component: Index })

function Index() {
  const [isLoading, setIsLoading] = createSignal(false)
  const { notify } = useNotifications()

  const handleLogIn = async () => {
    if (isLoading()) return

    setIsLoading(true)
    try {
      const result = await logIn()
      if (!result.success) {
        notify({
          type: 'error',
          message: `Error! ${result.error.message}`,
        })
        return
      }

      notify({ type: 'success', message: 'Redirecting...' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      class="hero bg-base-200 min-h-screen"
      classList={{ loading: isLoading() }}
    >
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">Welcome to AdU-Tutor</h1>
          <p class="py-6">
            AdU-Tutor is a platform that connects students with tutors for
            online tutoring services.
          </p>
          <button
            onClick={handleLogIn}
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
