import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { Dock, LoadingScreen, Navbar } from '@/components'

export const Route = createFileRoute('/info-hub')({ component: InfoHub })

function InfoHub() {
  const session = useAuthGuard({ requireAuth: true })

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <div class="card w-96 bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Card Title</h2>
            <p>
              A card component has a figure, a body part, and inside body there
              are title and actions parts
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">Buy Now</button>
            </div>
          </div>
        </div>
      </Show>
      <Dock />
    </>
  )
}
