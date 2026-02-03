import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { Show, createEffect } from 'solid-js'
import { authClient } from '@/lib/auth-client'
import { Dock, Navbar, LoadingScreen } from '@/components'

export const Route = createFileRoute('/app')({ component: App })

function App() {
  const session = authClient.useSession()
  const navigate = useNavigate()

  createEffect(() => {
    const { isPending, data } = session()
    if (!isPending && !data) {
      navigate({ to: '/', replace: true })
    }
  })

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
