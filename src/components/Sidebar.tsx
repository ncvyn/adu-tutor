import { Link, useNavigate } from '@tanstack/solid-router'
import { SearchUsers } from '@/components'
import type { UserResult } from '@/components'
import { useChatContext } from '@/components/ChatContext'

export function Sidebar() {
  const navigate = useNavigate()
  const { setSelectedRecipient } = useChatContext()

  const handleUserSelect = (user: UserResult): void => {
    setSelectedRecipient(user)
    navigate({ to: '/messages' })
  }

  return (
    <aside class="flex h-full w-full flex-col border-r border-base-300 bg-base-100">
      {/* Brand */}
      <div class="flex items-center gap-2 border-b border-base-300 px-5 py-4">
        <Link to="/info-hub" class="flex items-center gap-2">
          <img
            src="/adu-tutor-logo.svg"
            alt="AdU-Tutor"
            class="h-8 w-auto select-none"
          />
        </Link>
      </div>

      {/* Messages search */}
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold tracking-wide uppercase opacity-60">
            Messages
          </span>
        </div>
        <div class="mt-3">
          <SearchUsers onSelect={handleUserSelect} />
        </div>
      </div>
    </aside>
  )
}
