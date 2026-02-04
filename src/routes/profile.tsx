import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { Dock, LoadingScreen, Navbar } from '@/components'
import { useNotifications } from '@/lib/notifications'

export const Route = createFileRoute('/profile')({ component: Profile })

function Profile() {
  const session = useAuthGuard({ requireAuth: true })

  const { notify } = useNotifications()

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <button
          class="btn btn-neutral"
          onClick={() => notify({ type: 'info', message: 'Test notification' })}
        >
          Test notification
        </button>
      </Show>
      <Dock />
    </>
  )
}
