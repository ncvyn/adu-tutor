import { createFileRoute } from '@tanstack/solid-router'
import { Show, createSignal, onMount } from 'solid-js'

import { useAuthGuard } from '@/lib/auth-client'

import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import { BadgeWatcher } from '@/components/BadgeWatcher'
import { LoadingScreen } from '@/components/LoadingScreen'

import { type UserResult } from '@/components/messages/SearchUsers'
import { ChatPanel } from '@/components/messages/ChatPanel'
import { SearchUsers } from '@/components/messages/SearchUsers'
import { useChatContext } from '@/components/messages/ChatContext'

export const Route = createFileRoute('/messages')({
  ssr: false,
  component: Messages,
})

function Messages() {
  const [isClient, setIsClient] = createSignal(false)

  onMount(() => {
    setIsClient(true)
  })

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
    <Show when={isClient()} fallback={<LoadingScreen />}>
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
                <Show when={activeRecipient()} keyed>
                  {(recipient) => (
                    <ChatPanel
                      senderId={data().user.id}
                      recipient={recipient}
                      onClose={() => {
                        setSelectedRecipient(null)
                        setMobileSelectedUser(null)
                      }}
                    />
                  )}
                </Show>
              </div>
            </section>
          )}
        </Show>
      </AuthenticatedLayout>
    </Show>
  )
}
