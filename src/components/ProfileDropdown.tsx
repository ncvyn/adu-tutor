import { Show } from 'solid-js'
import { Link, useNavigate } from '@tanstack/solid-router'
import { authClient, signOut } from '@/lib/auth-client'
import { getInitials } from '@/lib/helper'
import { useNotifications } from '@/components/Notifications'
import { LogOut, User } from 'lucide-solid'

export function ProfileDropdown() {
  const session = authClient.useSession()
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    // Blur the active element to close the dropdown before signing out
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    await signOut(notify, navigate)
  }

  return (
    <Show when={session().data}>
      {(data) => (
        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-circle avatar avatar-placeholder"
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
            {/* User info header */}
            <div class="flex flex-col items-center gap-2 border-b border-base-300 pb-4">
              <div class="avatar avatar-placeholder">
                <div class="w-16 rounded-full bg-primary text-primary-content">
                  <span class="text-lg font-semibold">
                    {getInitials(data().user.name)}
                  </span>
                </div>
              </div>
              <div class="text-center">
                <p class="font-semibold">{data().user.name}</p>
                <p class="text-sm opacity-60">{data().user.email}</p>
              </div>
            </div>

            {/* Menu items */}
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
                  onClick={handleSignOut}
                >
                  <LogOut class="h-4 w-4" />
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </Show>
  )
}
