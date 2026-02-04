import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { Dock, LoadingScreen, Navbar } from '@/components'

export const Route = createFileRoute('/app')({ component: App })

function App() {
  const session = useAuthGuard({ requireAuth: true })

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <p>Logged in!</p>
      </Show>
      <Dock />
    </>
  )
}
