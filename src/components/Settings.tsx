import type { AvailabilityMap, ThemeMode } from '@/routes/profile'
import { For, Show, createSignal, onMount } from 'solid-js'
import { DAYS, SUBJECTS, applyTheme } from '@/routes/profile'
import { updateSettings } from '@/server/update-settings.functions'
import {
  clearNotifications,
  dismissNotification,
  getMyNotifications,
} from '@/server/notifications.functions'
import { deleteMyAccount } from '@/server/delete-account.functions'
import { useNavigate } from '@tanstack/solid-router'
import { useNotifications } from '@/components'

interface SettingsProps {
  profile: any
  refetchProfile: () => Promise<unknown>
}

export default function Settings(props: SettingsProps) {
  const { profile, refetchProfile } = props
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [bio, setBio] = createSignal(profile.bio ?? '')
  const [preferredSubject, setPreferredSubject] = createSignal<string>(
    profile.preferredSubject ?? SUBJECTS[0],
  )
  const [theme, setTheme] = createSignal<ThemeMode>(
    (localStorage.getItem('adu-theme') as ThemeMode | null) ?? 'system',
  )
  const [availability, setAvailability] = createSignal<AvailabilityMap>(
    profile.availability
      ? (JSON.parse(profile.availability) as AvailabilityMap)
      : {},
  )
  const [isSaving, setIsSaving] = createSignal(false)
  const [loadingNotifs, setLoadingNotifs] = createSignal(false)
  const [notifications, setNotifications] = createSignal<Array<any>>([])

  onMount(fetchNotifications)

  async function handleSave() {
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

  async function handleDismissNotification(id: string) {
    try {
      await dismissNotification({ data: { id } })
      await fetchNotifications()
    } catch (error) {
      notify({
        type: 'error',
        message: `Error dismissing notification: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  async function handleClearNotifications() {
    try {
      await clearNotifications()
      await fetchNotifications()
    } catch (error) {
      notify({
        type: 'error',
        message: `Error clearing notifications: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  async function handleDeleteAccount() {
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

  async function fetchNotifications() {
    setLoadingNotifs(true)
    try {
      const notifs = await getMyNotifications()
      setNotifications(Array.isArray(notifs) ? notifs : [])
    } finally {
      setLoadingNotifs(false)
    }
  }

  function handleThemeChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as ThemeMode
    setTheme(value)
    applyTheme(value)
    localStorage.setItem('adu-theme', value)
  }

  return (
    <div class="space-y-6">
      {/* Account Settings Card */}
      <div class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <h3 class="card-title text-lg">Account Settings</h3>
          <fieldset class="fieldset w-full">
            <legend class="fieldset-legend">Your bio</legend>
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
              {profile.role === 'tutor' ? 'to Teach' : 'to Learn'}
            </legend>
            <select
              class="select-bordered select"
              value={preferredSubject()}
              onChange={(e) => setPreferredSubject(e.currentTarget.value)}
            >
              <option disabled selected>
                Select a subject
              </option>
              <For each={SUBJECTS}>
                {(subject) => <option value={subject}>{subject}</option>}
              </For>
            </select>
          </fieldset>
          <fieldset class="fieldset w-full">
            <legend class="fieldset-legend">Program Theme</legend>
            <select
              class="select-bordered select"
              value={theme()}
              onChange={handleThemeChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </fieldset>
          <Show when={profile.role === 'tutor'}>
            <div class="space-y-2">
              <div class="font-medium">Availability Schedule</div>
              <p class="text-sm opacity-70">
                Add general day/time windows (e.g. 09:00-12:00, 14:00-17:00).
              </p>
              <For each={DAYS}>
                {(day) => (
                  <fieldset class="fieldset w-full">
                    <legend class="fieldset-legend">{day}</legend>
                    <input
                      class="input-bordered input"
                      value={availability()[day] ?? ''}
                      onInput={(e) =>
                        setAvailability({
                          ...availability(),
                          [day]: e.currentTarget.value,
                        })
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
              onClick={handleSave}
              disabled={isSaving()}
            >
              <Show
                when={!isSaving()}
                fallback={<span class="loading loading-sm loading-spinner" />}
              >
                Save Changes
              </Show>
            </button>
          </div>
        </div>
      </div>

      {/* Program Notifications Card */}
      <div class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex items-center justify-between">
            <h3 class="card-title text-lg">Program Notifications</h3>
            <button class="btn btn-sm" onClick={handleClearNotifications}>
              Clear All
            </button>
          </div>
          <Show
            when={!loadingNotifs()}
            fallback={<span class="loading loading-spinner" />}
          >
            <Show
              when={notifications().length > 0}
              fallback={<p class="text-sm opacity-70">No notifications yet.</p>}
            >
              <ul class="menu rounded-box bg-base-200">
                <For each={notifications()}>
                  {(n) => (
                    <li>
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-sm">{n.message}</span>
                        <button
                          class="btn btn-ghost btn-xs"
                          onClick={() => handleDismissNotification(n.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
      </div>

      {/* Danger Zone */}
      <div class="card border border-error/50 bg-base-100">
        <div class="card-body gap-4">
          <h3 class="card-title text-lg text-error">Danger Zone</h3>
          <p class="text-sm opacity-80">
            Deleting your account is permanent and cannot be undone.
          </p>
          <div class="card-actions justify-end">
            <button class="btn btn-error" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
