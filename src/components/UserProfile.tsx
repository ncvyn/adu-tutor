import { Show } from 'solid-js'
import { getInitials } from '@/lib/helper'
import { UserBadges, useNotifications } from '@/components'
import { signOut } from '@/lib/auth-client'
import { useNavigate } from '@tanstack/solid-router'

export function UserProfile(props: { profile: any }) {
  const { profile } = props
  const { notify } = useNotifications()
  const navigate = useNavigate()

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
      <Show when={profile.preferredSubject}>
        <div class="mt-2 badge badge-outline">
          {profile.role === 'tutor' ? 'Teaches' : 'Learns'}:{' '}
          {profile.preferredSubject}
        </div>
      </Show>
      <Show when={profile.bio}>
        <p class="mt-4 max-w-lg text-sm opacity-80">{profile.bio}</p>
      </Show>
      <UserBadges userId={profile.id} />
      <button
        class="btn mt-6 btn-error"
        onClick={() => signOut(notify, navigate)}
      >
        Sign out
      </button>
    </div>
  )
}

export default UserProfile
