import { For, Show, createSignal } from 'solid-js'
import { getInitials } from '@/lib/helper'
import { UserBadges } from '@/components'
import { APP_VERSION } from '@/lib/version.ts'
import { Info, LogOut } from 'lucide-solid'
import { signOut } from '@/lib/auth-client'
import { useNotifications } from '@/components/Notifications'
import { useNavigate } from '@tanstack/solid-router'
import { AboutUsModal } from './AboutUsModal'

export default function UserProfile(props: { profile: any }) {
  const { profile } = props

  const subjects: Array<string> = Array.isArray(profile.preferredSubjects)
    ? profile.preferredSubjects
    : typeof profile.preferredSubjects === 'string'
      ? JSON.parse(profile.preferredSubjects || '[]')
      : []

  const { notify } = useNotifications()
  const navigate = useNavigate()
  const [isSignOutOpen, setIsSignOutOpen] = createSignal(false)
  const [isSigningOut, setIsSigningOut] = createSignal(false)
  const [isAboutOpen, setIsAboutOpen] = createSignal(false)

  const openSignOutModal = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsSignOutOpen(true)
  }

  const closeSignOutModal = () => {
    if (!isSigningOut()) {
      setIsSignOutOpen(false)
    }
  }

  const confirmSignOut = async () => {
    if (isSigningOut()) return
    setIsSigningOut(true)
    try {
      await signOut(notify, navigate)
    } finally {
      setIsSigningOut(false)
      setIsSignOutOpen(false)
    }
  }

  const openAboutModal = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsAboutOpen(true)
  }

  const closeAboutModal = () => setIsAboutOpen(false)

  return (
    <div class="flex flex-col items-center text-center">
      <div class="avatar mb-4 avatar-placeholder">
        <div class="w-12 rounded-full bg-neutral text-neutral-content">
          <span class="text-md font-semibold">{getInitials(profile.name)}</span>
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

      <div class="mt-6 flex flex-col gap-2 md:hidden">
        <button
          type="button"
          class="btn flex-1 flex-nowrap items-center justify-center gap-2 whitespace-nowrap btn-info"
          onClick={openAboutModal}
        >
          <Info class="h-4 w-4" />
          About us
        </button>

        <button
          type="button"
          class="btn flex-1 flex-nowrap items-center justify-center gap-2 whitespace-nowrap btn-error"
          onClick={openSignOutModal}
        >
          <LogOut class="h-4 w-4" />
          Sign out
        </button>
      </div>

      <Show when={isAboutOpen()}>
        <AboutUsModal open={isAboutOpen()} onClose={closeAboutModal} />
      </Show>

      <dialog class={`modal ${isSignOutOpen() ? 'modal-open' : ''}`}>
        <div class="modal-box">
          <h3 class="text-lg font-bold">Sign out?</h3>
          <p class="mt-2 text-sm opacity-80">
            You’ll be signed out of your current session.
          </p>
          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              onClick={closeSignOutModal}
              disabled={isSigningOut()}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-error"
              onClick={confirmSignOut}
              disabled={isSigningOut()}
            >
              <Show
                when={!isSigningOut()}
                fallback={<span class="loading loading-xs loading-spinner" />}
              >
                Sign out
              </Show>
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" onClick={closeSignOutModal}>
            close
          </button>
        </form>
      </dialog>
    </div>
  )
}
