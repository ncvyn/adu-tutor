import { Link, useNavigate } from '@tanstack/solid-router'
import { BookCopy, MessageCircle } from 'lucide-solid'
import type { UserResult } from '@/components/SearchUsers'
import { SearchUsers } from '@/components/SearchUsers'
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
        <img
          src="/adu-tutor-logo.svg"
          alt="AdU-Tutor"
          class="h-8 w-auto select-none"
        />
      </div>

      {/* Navigation */}
      <nav class="border-b border-base-300 px-3 py-2">
        <ul class="menu menu-sm p-0">
          <li>
            <Link
              to="/messages"
              activeProps={{ class: 'active' }}
              class="flex items-center gap-3"
            >
              <MessageCircle class="h-4 w-4" />
              Messages
            </Link>
          </li>
          <li>
            <Link
              to="/info-hub"
              activeProps={{ class: 'active' }}
              class="flex items-center gap-3"
            >
              <BookCopy class="h-4 w-4" />
              Info Hub
            </Link>
          </li>
        </ul>
      </nav>

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
