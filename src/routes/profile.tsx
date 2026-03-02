import { createFileRoute } from '@tanstack/solid-router'
import { Show, Suspense, createResource } from 'solid-js'
import { signOut, useAuthGuard } from '@/lib/auth-client'
import { getUserProfile } from '@/server/get-user-profile.functions'
import { useNavigate } from '@tanstack/solid-router'
import { Dock, LoadingScreen, Navbar, useNotifications } from '@/components'

export const Route = createFileRoute('/profile')({ component: Profile })

function Profile() {
  const session = useAuthGuard({ requireAuth: true })
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const [userProfile] = createResource(
    () => session().data?.user.id,
    async () => {
      return await getUserProfile()
    },
  )

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <Suspense fallback={<LoadingScreen />}>
          <Show when={userProfile()}>
            {(profile) => (
              <div class="my-10 flex flex-col items-center">
                <div class="card w-full max-w-sm bg-base-100 shadow-xl">
                  <div class="card-body items-center text-center">
                    <div class="avatar mb-4 avatar-placeholder">
                      <div class="w-12 rounded-full bg-neutral text-neutral-content">
                        <span class="text-sm font-semibold">
                          {getInitials(profile().name)}
                        </span>
                      </div>
                    </div>
                    <h2 class="card-title">{profile().name}</h2>
                    <p class="text-base-content/70">{profile().email}</p>
                    <div class="mt-2 badge font-semibold tracking-wide uppercase badge-primary">
                      {profile().role}
                    </div>
                    <button
                      class="btn mt-6 btn-error"
                      onClick={() => signOut(notify, navigate)}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </Suspense>
      </Show>
      <Dock />
    </>
  )
}
