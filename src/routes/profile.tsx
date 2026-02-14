import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { signOut } from '@/lib/auth-client'
import { useSessionReady } from '@/lib/use-session-ready'
import { Dock, LoadingScreen, Navbar } from '@/components'
import { useNotifications } from '@/lib/notifications'

export const Route = createFileRoute('/profile')({ component: Profile })

function Profile() {
  const { session, isReady } = useSessionReady({ requireAuth: true })
  const { notify } = useNotifications()

  return (
    <>
      <Navbar />
      <Show when={isReady() && session().data} fallback={<LoadingScreen />}>
        <button
          class="btn btn-neutral"
          onClick={() => notify({ type: 'info', message: 'Test notification' })}
        >
          Test notification
        </button>
        <button class="btn btn-neutral" onClick={() => signOut(notify)}>
          Signout
        </button>
      </Show>
      <Dock />
    </>
  )
}
