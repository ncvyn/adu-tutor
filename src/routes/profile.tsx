import { createFileRoute } from '@tanstack/solid-router'
import { useQuery } from '@tanstack/solid-query'
import { ErrorBoundary, Show, Suspense, createSignal } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { getUserProfile } from '@/server/get-user-profile.functions'
import { LoadingScreen } from '@/components'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import type { DAYS } from '@/lib/constants'
import Settings from '@/components/profile/Settings'
import UserProfile from '@/components/profile/UserProfile'

export const Route = createFileRoute('/profile')({
  ssr: false,
  component: Profile,
})

export type ThemeMode = 'light' | 'dark' | 'system'
export type AvailabilityMap = Partial<Record<(typeof DAYS)[number], string>>

export function applyTheme(value: ThemeMode): void {
  const html = document.documentElement
  if (value === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    html.setAttribute('data-theme', value)
  }
  localStorage.setItem('adu-theme', value)
}

function ProfileErrorFallback() {
  return (
    <div class="alert alert-error">
      <span>Failed to load profile data.</span>
    </div>
  )
}

function Profile() {
  const session = useAuthGuard({ requireAuth: true })
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  const userProfileQuery = useQuery(() => ({
    queryKey: ['user-profile', session().data?.user.id] as const,
    enabled: !!session().data?.user.id,
    queryFn: async () => getUserProfile(),
  }))

  return (
    <AuthenticatedLayout>
      <Show when={session().data} fallback={<LoadingScreen />}>
        <ErrorBoundary fallback={<ProfileErrorFallback />}>
          <Suspense fallback={<LoadingScreen />}>
            <Show when={userProfileQuery.data}>
              {(profile) => (
                <div class="my-10 flex flex-col items-center px-4">
                  <div class="card w-full max-w-3xl bg-base-100 shadow-xl">
                    <div class="card-body">
                      <div class="mb-4 flex items-center justify-between">
                        <h2 class="card-title">
                          {isSettingsOpen() ? 'Settings' : 'Profile'}
                        </h2>
                        <button
                          class="btn btn-sm btn-primary"
                          onClick={() => setIsSettingsOpen((v) => !v)}
                        >
                          {isSettingsOpen() ? 'Back to Profile' : 'Settings'}
                        </button>
                      </div>
                      <Show
                        when={!isSettingsOpen()}
                        fallback={
                          <Settings
                            profile={profile()}
                            refetchProfile={() => userProfileQuery.refetch()}
                          />
                        }
                      >
                        <UserProfile profile={profile()} />
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
  )
}
