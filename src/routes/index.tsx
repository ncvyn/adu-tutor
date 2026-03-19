import { createFileRoute } from '@tanstack/solid-router'
import { Show, createSignal } from 'solid-js'
import { signIn, useAuthGuard } from '@/lib/auth-client'
import { LoadingScreen, useNotifications } from '@/components'

import AdULogo from '@/adulogo.png'

export const Route = createFileRoute('/')({ component: Index })

function Index() {
  const session = useAuthGuard({ requireGuest: true })

  const [isLoading, setIsLoading] = createSignal(false)
  const { notify } = useNotifications()

  const handleSignIn = async () => {
    if (isLoading()) return

    setIsLoading(true)
    await signIn(notify)
    setIsLoading(false)
  }

  return (
    <Show
      when={!session().isPending && !session().data}
      fallback={<LoadingScreen />}
    >
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content px-0">
          <div class="flex max-w-lg flex-col">
            <div
              aria-label="AdU-Tutor"
              class="mask h-32 w-screen shrink-0 self-center bg-base-content mask-[url('/adu-tutor-logo.svg')] mask-contain mask-center mask-no-repeat md:w-lg"
            />
            <span class="-mt-3 w-full px-2.5 text-center text-3xl sm:text-left">
              {'A platform'}
              <br class="block sm:hidden" />
              {' for '}
              <span class="text-rotate duration-20000">
                <span class="text-left text-primary-content">
                  <span class="bg-primary px-2">Tutors.</span>
                  <span class="bg-primary px-2">Tutees.</span>
                  <span class="bg-primary px-2">Students.</span>
                  <span class="bg-primary px-2">Teachers.</span>
                  <span class="bg-primary px-2">Learners.</span>
                </span>
              </span>
            </span>
            <button
              onClick={handleSignIn}
              classList={{ loading: isLoading() }}
              class="btn mt-8 self-center text-center btn-primary"
            >
              <img class="w-6" src={AdULogo} alt="Adamson University logo" />
              Login with AdU Mail
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
