import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { CircleX } from 'lucide-solid'
import { HomePage, LandingPage } from '@/pages'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const session = authClient.useSession()

  return (
    <div class="min-h-screen">
      <Show when={session().data} fallback={<LandingPage />}>
        <HomePage />
      </Show>
      <Show when={session().error}>
        <div role="alert" class="alert alert-error">
          <CircleX />
          <span>{session().error?.message}</span>
        </div>
      </Show>
    </div>
  )
}
