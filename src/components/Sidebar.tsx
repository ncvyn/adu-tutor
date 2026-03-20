import { Link, useNavigate } from '@tanstack/solid-router'
import { SearchUsers } from '@/components'
import type { UserResult } from '@/components'
import { useChatContext } from '@/components/messages/ChatContext'

export function Sidebar() {
  const navigate = useNavigate()
  const { setSelectedRecipient } = useChatContext()

  const handleUserSelect = (user: UserResult): void => {
    setSelectedRecipient(user)
    navigate({ to: '/messages' })
  }

  return (
    <aside class="flex h-full w-full flex-col border-r border-base-300 bg-base-100">
      {/* AdU-Tutor logo */}
      <div class="flex items-center gap-2 border-b border-base-300 px-15 py-2">
        <div
          class="tooltip tooltip-right tooltip-primary"
          data-tip="Go to Info Hub"
        >
          <Link to="/info-hub" class="flex items-center gap-2">
            <div
              aria-label="AdU-Tutor"
              class="mask h-10.75 w-45 shrink-0 bg-base-content mask-[url('/adu-tutor-logo.svg')] mask-contain mask-center mask-no-repeat"
            />
          </Link>
        </div>
      </div>

      {/* Messages search */}
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold tracking-wide uppercase">
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
