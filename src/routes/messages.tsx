import { createFileRoute } from '@tanstack/solid-router'
import { Show, createSignal } from 'solid-js'
import type { UserResult } from '@/components/SearchUsers'
import { useAuthGuard } from '@/lib/auth-client'
import {
  ChatPanel,
  Dock,
  LoadingScreen,
  Navbar,
  SearchUsers,
} from '@/components'

export const Route = createFileRoute('/messages')({ component: Messages })

function Messages() {
  const session = useAuthGuard({ requireAuth: true })
  const [selectedUser, setSelectedUser] = createSignal<UserResult | null>(null)

  return (
    <div class="flex h-dvh flex-col">
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        {(data) => (
          <section class="mx-auto my-5 flex min-h-0 w-full flex-1 flex-col px-4 pb-18 xl:max-w-3/4 xl:pb-0">
            <div class="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,320px)_1fr]">
              <aside class="rounded-box border border-base-300 bg-base-100 p-5">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold tracking-wide uppercase opacity-60">
                    Messages
                  </span>
                </div>
                <div class="mt-3">
                  <SearchUsers onSelect={(user) => setSelectedUser(user)} />
                </div>
              </aside>

              <Show
                when={selectedUser()}
                fallback={
                  <section class="flex items-center justify-center rounded-box border border-base-300 bg-base-100">
                    <p class="text-sm opacity-60">
                      Search for a user to start a conversation
                    </p>
                  </section>
                }
              >
                {(recipient) => (
                  <ChatPanel
                    senderId={data().user.id}
                    recipient={recipient()}
                  />
                )}
              </Show>
            </div>
          </section>
        )}
      </Show>
      <Dock />
    </div>
  )
}
