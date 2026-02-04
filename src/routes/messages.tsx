import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { Dock, LoadingScreen, Navbar } from '@/components'
import { useNotifications } from '@/lib/notifications'

export const Route = createFileRoute('/messages')({ component: Messages })

function Messages() {
  const session = useAuthGuard({ requireAuth: true })

  const { notify } = useNotifications()

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <li class="p-4 pb-2 text-xs tracking-wide opacity-60">Messages</li>
        <ul class="list shadow-md">
          <li class="list-row">
            <div>User</div>
          </li>
        </ul>
      </Show>
      <Dock />
    </>
  )
}
