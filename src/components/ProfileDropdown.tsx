import { Show, createSignal } from 'solid-js'
import { Link, useNavigate } from '@tanstack/solid-router'
import { authClient, signOut } from '@/lib/auth-client'
import { getInitials } from '@/lib/helper'
import { useNotifications } from '@/components/Notifications'
import { LogOut, User } from 'lucide-solid'

export function ProfileDropdown() {
  const session = authClient.useSession()
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [isSignOutOpen, setIsSignOutOpen] = createSignal(false)
  const [isSigningOut, setIsSigningOut] = createSignal(false)

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

  return (
    <Show when={session().data}>
      {(data) => (
        <>
          <div class="dropdown dropdown-end">
            <div
              tabindex="0"
              role="button"
              class="btn avatar avatar-placeholder btn-circle btn-ghost"
              aria-label="Open profile menu"
            >
              <div class="w-10 rounded-full bg-primary text-primary-content">
                <span class="text-sm font-semibold">
                  {getInitials(data().user.name)}
                </span>
              </div>
            </div>

            <div
              tabindex="0"
              class="dropdown-content z-50 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-4 shadow-xl"
            >
              <div class="flex flex-col items-center gap-2 border-b border-base-300 pb-4">
                <div class="avatar avatar-placeholder">
                  <div class="w-16 rounded-full bg-primary text-primary-content">
                    <span class="text-lg font-semibold">
                      {getInitials(data().user.name)}
                    </span>
                  </div>
                </div>
                <div class="block w-full min-w-0 text-center">
                  <p class="font-semibold">{data().user.name}</p>
                  <p class="overflow-hidden text-sm text-ellipsis whitespace-nowrap opacity-60">
                    {data().user.email}
                  </p>
                </div>
              </div>

              <ul class="menu mt-2 p-0" role="menu">
                <li role="none">
                  <Link
                    to="/profile"
                    class="flex items-center gap-3"
                    role="menuitem"
                  >
                    <User class="h-4 w-4" />
                    Profile & Settings
                  </Link>
                </li>
                <li role="none">
                  <button
                    class="flex items-center gap-3 text-error"
                    role="menuitem"
                    onClick={openSignOutModal}
                  >
                    <LogOut class="h-4 w-4" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>

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
                    fallback={
                      <span class="loading loading-xs loading-spinner" />
                    }
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
        </>
      )}
    </Show>
  )
}
