import { createFileRoute } from '@tanstack/solid-router'
import { Show, createSignal } from 'solid-js'
import { useAuthGuard } from '@/lib/auth-client'
import {
  Dock,
  LoadingScreen,
  Navbar,
  SearchUsers,
  ChatPanel,
} from '@/components'
import type { UserResult } from '@/components/SearchUsers'

export const Route = createFileRoute('/messages')({ component: Messages })

function Messages() {
  const session = useAuthGuard({ requireAuth: true })
  const [selectedUser, setSelectedUser] = createSignal<UserResult | null>(null)

  return (
    <>
      <Navbar />
      <Show when={session().data} fallback={<LoadingScreen />}>
        {(data) => (
          <section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24">
            <div class="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
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
                  <section class="flex h-96 items-center justify-center rounded-box border border-base-300 bg-base-100">
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
    </>
  )
}
