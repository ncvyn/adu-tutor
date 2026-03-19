import { For, Show } from 'solid-js'
import { getInitials } from '@/lib/helper'
import { UserBadges } from '@/components'
import { APP_VERSION } from '@/lib/version.ts'

export default function UserProfile(props: { profile: any }) {
  const { profile } = props

  const subjects: Array<string> = Array.isArray(profile.preferredSubjects)
    ? profile.preferredSubjects
    : typeof profile.preferredSubjects === 'string'
      ? JSON.parse(profile.preferredSubjects || '[]')
      : []

  return (
    <div class="flex flex-col items-center text-center">
      <div class="avatar mb-4 avatar-placeholder">
        <div class="w-12 rounded-full bg-neutral text-neutral-content">
          <span class="text-sm font-semibold">{getInitials(profile.name)}</span>
        </div>
      </div>
      <h3 class="text-xl font-semibold">{profile.name}</h3>
      <div class="mt-2 badge font-semibold tracking-wide uppercase badge-primary">
        {profile.role}
      </div>
      <Show when={subjects.length > 0}>
        <div class="mt-2 flex flex-wrap justify-center gap-2">
          <For each={subjects}>
            {(subject) => (
              <div class="badge font-semibold tracking-wide uppercase badge-info">
                {subject}
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={profile.bio}>
        <p class="mt-4 max-w-lg text-sm opacity-80">{profile.bio}</p>
      </Show>
      <UserBadges userId={profile.id} />
      <p class="mt-6 text-xs opacity-60">AdU-Tutor v{APP_VERSION}</p>
    </div>
  )
}
