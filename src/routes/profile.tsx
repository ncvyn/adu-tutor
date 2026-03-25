import { createFileRoute } from '@tanstack/solid-router'
import { useQuery } from '@tanstack/solid-query'
import { ErrorBoundary, Show, Suspense, createSignal, onMount } from 'solid-js'
import { Undo2, UserRoundCog } from 'lucide-solid'

import { useAuthGuard } from '@/lib/auth-client'
import { type DAYS } from '@/lib/constants'
import { getUser } from '@/server/get-user.functions'

import { LoadingScreen } from '@/components/LoadingScreen'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import { BadgeWatcher } from '@/components/BadgeWatcher'

import Settings from '@/components/profile/Settings'
import UserProfile from '@/components/profile/UserProfile'

export const Route = createFileRoute('/profile')({
  ssr: false,
  component: Profile,
})

export type AvailabilityMap = Partial<Record<(typeof DAYS)[number], string>>

function ProfileErrorFallback() {
  return (
    <div class="alert alert-error">
      <span>Failed to load profile data.</span>
    </div>
  )
}

function Profile() {
  const [isClient, setIsClient] = createSignal(false)

  onMount(() => {
    setIsClient(true)
  })

  const session = useAuthGuard({ requireAuth: true })
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  const userQuery = useQuery(() => ({
    queryKey: ['user', session().data?.user.id] as const,
    enabled: isClient() && !!session().data?.user.id,
    queryFn: async () => getUser(),
  }))

  return (
    <Show when={isClient()} fallback={<LoadingScreen />}>
      <AuthenticatedLayout>
        <BadgeWatcher />
        <Show when={session().data} fallback={<LoadingScreen />}>
          <ErrorBoundary fallback={<ProfileErrorFallback />}>
            <Suspense fallback={<LoadingScreen />}>
              <Show when={userQuery.data}>
                {(user) => (
                  <div class="my-10 flex flex-col items-center px-4">
                    <div class="card w-full max-w-3xl bg-base-100 shadow-xl">
                      <div class="card-body">
                        <div class="mb-4 flex items-center justify-between">
                          <h2 class="card-title">
                            {isSettingsOpen() ? 'Settings' : 'Profile'}
                          </h2>
                          <div
                            class="tooltip-neutral tooltip"
                            data-tip={
                              isSettingsOpen()
                                ? 'Back to profile'
                                : 'Open settings'
                            }
                          >
                            <button
                              class="btn btn-sm btn-primary"
                              onClick={() => setIsSettingsOpen((v) => !v)}
                            >
                              {isSettingsOpen() ? <Undo2 /> : <UserRoundCog />}
                            </button>
                          </div>
                        </div>
                        <Show
                          when={!isSettingsOpen()}
                          fallback={
                            <Settings
                              user={user()}
                              refetchUser={() => userQuery.refetch()}
                            />
                          }
                        >
                          <UserProfile user={user()} />
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </Suspense>
          </ErrorBoundary>
        </Show>
      </AuthenticatedLayout>
    </Show>
  )
}
