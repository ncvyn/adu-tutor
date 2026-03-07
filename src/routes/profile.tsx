import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import {
  For,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  onMount,
} from 'solid-js'
import { signOut, useAuthGuard } from '@/lib/auth-client'
import { getUserProfile } from '@/server/get-user-profile.functions'
import { updateSettings } from '@/server/update-settings.functions'
import {
  clearNotifications,
  dismissNotification,
  getMyNotifications,
} from '@/server/notifications.functions'
import { deleteMyAccount } from '@/server/delete-account.functions'
import {
  Dock,
  LoadingScreen,
  Navbar,
  UserBadges,
  useNotifications,
} from '@/components'
import { getInitials } from '@/lib/helper'

export const Route = createFileRoute('/profile')({ component: Profile })

const SUBJECTS = ['Math', 'Science', 'English', 'Programming', 'Other'] as const
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

type ThemeMode = 'light' | 'dark' | 'system'
type AvailabilityMap = Partial<Record<(typeof DAYS)[number], string>>

function applyTheme(value: ThemeMode): void {
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
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)
  const [isSaving, setIsSaving] = createSignal(false)

  const [bio, setBio] = createSignal('')
  const [preferredSubject, setPreferredSubject] = createSignal<string>('Math')
  const [theme, setTheme] = createSignal<ThemeMode>('system')
  const [availability, setAvailability] = createSignal<AvailabilityMap>({})

  const [userProfile, { refetch: refetchProfile }] = createResource(
    () => session().data?.user.id,
    async () => getUserProfile(),
  )

  const [notifications, { refetch: refetchNotifications }] = createResource(
    () => session().data?.user.id,
    async () => getMyNotifications(),
  )

  onMount(() => {
    const savedTheme =
      (localStorage.getItem('adu-theme') as ThemeMode | null) ?? 'system'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  })

  createEffect(() => {
    const profile = userProfile()
    if (!profile) return

    setBio(profile.bio)
    setPreferredSubject(profile.preferredSubject)

    try {
      setAvailability(
        profile.availability
          ? (JSON.parse(profile.availability) as AvailabilityMap)
          : {},
      )
    } catch {
      setAvailability({})
    }
  })

  async function handleSaveSettings(): Promise<void> {
    const profile = userProfile()
    if (!profile || isSaving()) return

    setIsSaving(true)
    try {
      await updateSettings({
        data: {
          bio: bio().trim(),
          preferredSubject: preferredSubject(),
          availability:
            profile.role === 'tutor' ? JSON.stringify(availability()) : '',
        },
      })

      notify({ type: 'success', message: 'Settings saved.' })
      await refetchProfile()
    } catch (error) {
      notify({
        type: 'error',
        message: `Error saving settings: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDismissNotification(id: string): Promise<void> {
    try {
      await dismissNotification({ data: { id } })
      await refetchNotifications()
    } catch (error) {
      notify({
        type: 'error',
        message: `Error dismissing notification: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  async function handleClearNotifications(): Promise<void> {
    try {
      await clearNotifications()
      await refetchNotifications()
    } catch (error) {
      notify({
        type: 'error',
        message: `Error clearing notifications: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    const confirmed = window.confirm(
      'Delete your account permanently? This cannot be undone.',
    )
    if (!confirmed) return

    try {
      await deleteMyAccount()
      notify({ type: 'success', message: 'Account deleted.' })
      await navigate({ to: '/', replace: true })
    } catch (error) {
      notify({
        type: 'error',
        message: `Error deleting account: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

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
                        <div class="space-y-6">
                          <div class="card border border-base-300 bg-base-100">
                            <div class="card-body gap-4">
                              <h3 class="card-title text-lg">
                                Account Settings
                              </h3>

                              <fieldset class="fieldset w-full">
                                <legend class="fieldset-legend">
                                  Your bio
                                </legend>
                                <textarea
                                  class="textarea-bordered textarea h-24"
                                  placeholder="Tell others about yourself"
                                  value={bio()}
                                  onInput={(e) => setBio(e.currentTarget.value)}
                                />
                              </fieldset>

                              <fieldset class="fieldset w-full">
                                <legend class="fieldset-legend">
                                  Preferred Subject{' '}
                                  {profile().role === 'tutor'
                                    ? 'to Teach'
                                    : 'to Learn'}
                                </legend>
                                <select
                                  class="select-bordered select"
                                  value={preferredSubject()}
                                  onChange={(e) =>
                                    setPreferredSubject(e.currentTarget.value)
                                  }
                                >
                                  <option disabled selected>
                                    Select a subject
                                  </option>
                                  <For each={SUBJECTS}>
                                    {(subject) => (
                                      <option value={subject}>{subject}</option>
                                    )}
                                  </For>
                                </select>
                              </fieldset>

                              <fieldset class="fieldset w-full">
                                <legend class="fieldset-legend">
                                  Program Theme
                                </legend>
                                <select
                                  class="select-bordered select"
                                  value={theme()}
                                  onChange={(e) => {
                                    const value = e.currentTarget
                                      .value as ThemeMode
                                    setTheme(value)
                                    applyTheme(value)
                                  }}
                                >
                                  <option value="light">Light</option>
                                  <option value="dark">Dark</option>
                                  <option value="system">System</option>
                                </select>
                              </fieldset>

                              <Show when={profile().role === 'tutor'}>
                                <div class="space-y-2">
                                  <div class="font-medium">
                                    Availability Schedule
                                  </div>
                                  <p class="text-sm opacity-70">
                                    Add general day/time windows (e.g.
                                    09:00-12:00, 14:00-17:00).
                                  </p>

                                  <For each={DAYS}>
                                    {(day) => (
                                      <fieldset class="fieldset w-full">
                                        <legend class="fieldset-legend">
                                          {day}
                                        </legend>
                                        <input
                                          class="input-bordered input"
                                          value={availability()[day] ?? ''}
                                          onInput={(e) =>
                                            setAvailability((prev) => ({
                                              ...prev,
                                              [day]: e.currentTarget.value,
                                            }))
                                          }
                                          placeholder="Time window"
                                        />
                                      </fieldset>
                                    )}
                                  </For>
                                </div>
                              </Show>

                              <div class="card-actions justify-end">
                                <button
                                  class="btn btn-primary"
                                  onClick={handleSaveSettings}
                                  disabled={isSaving()}
                                >
                                  <Show
                                    when={!isSaving()}
                                    fallback={
                                      <span class="loading loading-sm loading-spinner" />
                                    }
                                  >
                                    Save Changes
                                  </Show>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div class="card border border-base-300 bg-base-100">
                            <div class="card-body gap-4">
                              <div class="flex items-center justify-between">
                                <h3 class="card-title text-lg">
                                  Program Notifications
                                </h3>
                                <button
                                  class="btn btn-sm"
                                  onClick={handleClearNotifications}
                                >
                                  Clear All
                                </button>
                              </div>

                              <Show
                                when={(notifications() ?? []).length > 0}
                                fallback={
                                  <p class="text-sm opacity-70">
                                    No notifications yet.
                                  </p>
                                }
                              >
                                <ul class="menu rounded-box bg-base-200">
                                  <For each={notifications() ?? []}>
                                    {(n) => (
                                      <li>
                                        <div class="flex items-center justify-between gap-3">
                                          <span class="text-sm">
                                            {n.message}
                                          </span>
                                          <button
                                            class="btn btn-ghost btn-xs"
                                            onClick={() =>
                                              handleDismissNotification(n.id)
                                            }
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                      </li>
                                    )}
                                  </For>
                                </ul>
                              </Show>
                            </div>
                          </div>

                          <div class="card border border-error/50 bg-base-100">
                            <div class="card-body gap-4">
                              <h3 class="card-title text-lg text-error">
                                Danger Zone
                              </h3>
                              <p class="text-sm opacity-80">
                                Deleting your account is permanent and cannot be
                                undone.
                              </p>
                              <div class="card-actions justify-end">
                                <button
                                  class="btn btn-error"
                                  onClick={handleDeleteAccount}
                                >
                                  Delete Account
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div class="flex flex-col items-center text-center">
                        <div class="avatar mb-4 avatar-placeholder">
                          <div class="w-12 rounded-full bg-neutral text-neutral-content">
                            <span class="text-sm font-semibold">
                              {getInitials(profile().name)}
                            </span>
                          </div>
                        </div>

                        <h3 class="text-xl font-semibold">{profile().name}</h3>
                        <div class="mt-2 badge font-semibold tracking-wide uppercase badge-primary">
                          {profile().role}
                        </div>

                        <Show when={profile().preferredSubject}>
                          <div class="mt-2 badge badge-outline">
                            {profile().role === 'tutor' ? 'Teaches' : 'Learns'}:{' '}
                            {profile().preferredSubject}
                          </div>
                        </Show>

                        <Show when={profile().bio}>
                          <p class="mt-4 max-w-lg text-sm opacity-80">
                            {profile().bio}
                          </p>
                        </Show>

                        <UserBadges userId={profile().id} />

                        <button
                          class="btn mt-6 btn-error"
                          onClick={() => signOut(notify, navigate)}
                        >
                          Sign out
                        </button>
                      </div>
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
