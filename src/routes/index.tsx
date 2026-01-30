import { createFileRoute } from '@tanstack/solid-router'
import { HomePage, LandingPage } from '@/pages'
import { authClient } from '@/lib/auth-client'
import { Show } from 'solid-js'
import { CircleX } from 'lucide-solid'

const { data: session, error } = await authClient.getSession()

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div class="min-h-screen">
      <Show when={session} fallback={<LandingPage />}>
        <HomePage />
      </Show>
      <Show when={error}>
        <div role="alert" class="alert alert-error">
          <CircleX />
          <span>{error?.message}</span>
        </div>
      </Show>
    </div>
  )
}
