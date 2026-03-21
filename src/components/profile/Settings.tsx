import type { AvailabilityMap } from '@/routes/profile'
import { DAYS, SUBJECTS } from '@/lib/constants'
import { For, Show, createSignal, onMount } from 'solid-js'
import { applyTheme } from '@/lib/theme'
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

const MAXIMUM_SUBJECTS = 5

type TimeWindow = { start: string; end: string }

const THEME_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'shiro' },
  { label: 'Dark', value: 'kuro' },
]

export default function Settings(props: SettingsProps) {
  const { profile, refetchProfile } = props
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [bio, setBio] = createSignal(profile.bio ?? '')
  const [preferredSubjects, setPreferredSubjects] = createSignal<Array<string>>(
    Array.isArray(profile.preferredSubjects)
      ? profile.preferredSubjects
      : typeof profile.preferredSubjects === 'string'
        ? JSON.parse(profile.preferredSubjects || '[]')
        : [],
  )
  const [theme, setTheme] = createSignal<string>(
    localStorage.getItem('adu-theme') ?? 'system',
  )

  // Parse existing availability string "09:00-12:00, 14:00-17:00" into structured UI state
  const initialAvailability = profile.availability
    ? (JSON.parse(profile.availability) as AvailabilityMap)
    : {}
  const initialSchedule: Record<string, Array<TimeWindow>> = {}
  DAYS.forEach((day) => {
    const dayStr = initialAvailability[day] || ''
    initialSchedule[day] = dayStr
      ? dayStr.split(',').map((window) => {
          const [start = '', end = ''] = window.split('-')
          return { start: start.trim(), end: end.trim() }
        })
      : []
  })
  const [schedule, setSchedule] =
    createSignal<Record<string, Array<TimeWindow>>>(initialSchedule)

  const [isSaving, setIsSaving] = createSignal(false)
  const [loadingNotifs, setLoadingNotifs] = createSignal(false)
  const [notifications, setNotifications] = createSignal<Array<any>>([])

  onMount(fetchNotifications)

  async function handleSave() {
    setIsSaving(true)
    try {
      const serializedAvailability: AvailabilityMap = {}
      DAYS.forEach((day) => {
        const windows = schedule()[day]
        const validWindows = windows
          .filter((w) => w.start && w.end)
          .map((w) => `${w.start}-${w.end}`)

        if (validWindows.length > 0) {
          serializedAvailability[day] = validWindows.join(', ')
        }
      })

      await updateSettings({
        data: {
          bio: bio().trim(),
          preferredSubjects: preferredSubjects(),
          availability:
            profile.role === 'tutor'
              ? JSON.stringify(serializedAvailability)
              : '',
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

  // Schedule Manipulation Helpers
  function addTimeWindow(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: '', end: '' }],
    }))
  }

  function updateTimeWindow(
    day: string,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) {
    setSchedule((prev) => {
      const updatedDay = [...prev[day]]
      updatedDay[index] = { ...updatedDay[index], [field]: value }
      return { ...prev, [day]: updatedDay }
    })
  }

  function removeTimeWindow(day: string, index: number) {
    setSchedule((prev) => {
      const updatedDay = [...prev[day]]
      updatedDay.splice(index, 1)
      return { ...prev, [day]: updatedDay }
    })
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

  function handleThemeChange(value: string) {
    setTheme(value)
    applyTheme(value)
  }

  function toggleSubject(subject: string) {
    setPreferredSubjects((curr) =>
      curr.includes(subject)
        ? curr.filter((s) => s !== subject)
        : curr.length < MAXIMUM_SUBJECTS
          ? [...curr, subject]
          : curr,
    )
  }

  return (
    <div class="space-y-6">
      {/* Account Card */}
      <div class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <h3 class="card-title text-lg">Account</h3>
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
              Preferred subjects{' '}
              {profile.role === 'tutor' ? 'to teach' : 'to learn'}
            </legend>
            <div class="flex flex-wrap gap-2">
              <For each={SUBJECTS}>
                {(subject) => (
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary"
                      checked={preferredSubjects().includes(subject)}
                      onInput={() => toggleSubject(subject)}
                      disabled={
                        !preferredSubjects().includes(subject) &&
                        preferredSubjects().length >= MAXIMUM_SUBJECTS
                      }
                    />
                    <span>{subject}</span>
                  </label>
                )}
              </For>
            </div>
            <div class="mt-1 text-xs opacity-70">
              Choose up to {MAXIMUM_SUBJECTS} subjects.
            </div>
          </fieldset>

          <fieldset class="fieldset w-full">
            <legend class="fieldset-legend">Program theme</legend>
            <fieldset class="fieldset">
              <For each={THEME_OPTIONS}>
                {(option) => (
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="theme-radios"
                      class="theme-controller radio radio-md radio-primary"
                      value={option.value}
                      checked={theme() === option.value}
                      onInput={() => handleThemeChange(option.value)}
                    />
                    {option.label}
                  </label>
                )}
              </For>
            </fieldset>
          </fieldset>

          <Show when={profile.role === 'tutor'}>
            <fieldset class="fieldset w-full">
              <legend class="fieldset-legend">Availability schedule</legend>
              <p class="label">
                Set the hours you are generally available to tutor.
              </p>
            </fieldset>
            <div class="grid gap-4 lg:max-w-2/3">
              <For each={DAYS}>
                {(day) => (
                  <div class="flex flex-col gap-2 rounded-lg border border-base-200 bg-base-100 p-3 shadow-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold">{day}</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        onClick={() => addTimeWindow(day)}
                      >
                        +
                      </button>
                    </div>

                    <Show
                      when={schedule()[day].length > 0}
                      fallback={
                        <span class="text-sm italic opacity-50">
                          No schedule.
                        </span>
                      }
                    >
                      <div class="flex flex-col gap-2">
                        <For each={schedule()[day]}>
                          {(window, index) => (
                            <div class="flex items-center gap-2">
                              <input
                                type="time"
                                class="input-bordered input input-sm flex-1"
                                value={window.start}
                                onInput={(e) =>
                                  updateTimeWindow(
                                    day,
                                    index(),
                                    'start',
                                    e.currentTarget.value,
                                  )
                                }
                              />
                              <span class="text-xs opacity-70">to</span>
                              <input
                                type="time"
                                class="input-bordered input input-sm flex-1"
                                value={window.end}
                                onInput={(e) =>
                                  updateTimeWindow(
                                    day,
                                    index(),
                                    'end',
                                    e.currentTarget.value,
                                  )
                                }
                              />
                              <button
                                type="button"
                                class="btn btn-square text-base-content btn-ghost btn-sm"
                                onClick={() => removeTimeWindow(day, index())}
                                title="Remove time window"
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <div class="mt-4 card-actions justify-end">
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
