import { createFileRoute } from '@tanstack/solid-router'
import { Show, createSignal } from 'solid-js'
import type { UserResult } from '@/components/messages/SearchUsers'
import { useAuthGuard } from '@/lib/auth-client'
import {
  AuthenticatedLayout,
  ChatPanel,
  LoadingScreen,
  SearchUsers,
} from '@/components'
import { useChatContext } from '@/components/messages/ChatContext'
import { BadgeWatcher } from '@/components/BadgeWatcher'

export const Route = createFileRoute('/messages')({
  ssr: false,
  component: Messages,
})

function Messages() {
  const session = useAuthGuard({ requireAuth: true })
  const { selectedRecipient, setSelectedRecipient } = useChatContext()

  // Mobile-only local search state (sidebar handles desktop search)
  const [mobileSelectedUser, setMobileSelectedUser] =
    createSignal<UserResult | null>(null)

  // Use context recipient (from sidebar) or mobile local selection
  const activeRecipient = (): UserResult | null =>
    selectedRecipient() || mobileSelectedUser()

  const handleMobileSelect = (user: UserResult): void => {
    setMobileSelectedUser(user)
    setSelectedRecipient(user)
  }

  return (
    <AuthenticatedLayout>
      <BadgeWatcher />
      <Show when={session().data} fallback={<LoadingScreen />}>
        {(data) => (
          <section class="flex h-full min-h-0 flex-col px-4 py-5">
            {/* Mobile-only search */}
            <div class="mb-3 md:hidden">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold tracking-wide uppercase">
                  Messages
                </span>
              </div>
              <div class="mt-3">
                <SearchUsers onSelect={handleMobileSelect} />
              </div>
            </div>

            {/* Chat area */}
            <div class="min-h-0 flex-1">
              <Show
                when={activeRecipient()}
                keyed
                fallback={
                  <section class="flex h-full items-center justify-center rounded-box border border-base-300 bg-base-100">
                    <p class="text-sm opacity-60">
                      Search for a user to start a conversation
                    </p>
                  </section>
                }
              >
                {(recipient) => (
                  <ChatPanel senderId={data().user.id} recipient={recipient} />
                )}
              </Show>
            </div>
          </section>
        )}
      </Show>
    </AuthenticatedLayout>
  )
}
