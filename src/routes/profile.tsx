import { createFileRoute } from '@tanstack/solid-router'
import { Show, Suspense, createResource, createSignal } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import { getUserProfile } from '@/server/get-user-profile.functions'
import { Dock, LoadingScreen, Navbar } from '@/components'
import Settings from '@/components/Settings'
import UserProfile from '@/components/UserProfile'

export const Route = createFileRoute('/profile')({ component: Profile })

export const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'Programming',
  'Other',
] as const
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

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

function Profile() {
  const session = useAuthGuard({ requireAuth: true })
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  const [userProfile, { refetch: refetchProfile }] = createResource(
    () => session().data?.user.id,
    async () => getUserProfile(),
  )

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        <Suspense fallback={<LoadingScreen />}>
          <Show when={userProfile()}>
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
                          refetchProfile={() =>
                            Promise.resolve(refetchProfile())
                          }
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
      </Show>
      <Dock />
    </>
  )
}
