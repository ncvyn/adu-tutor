import { createFileRoute } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { useSessionReady } from '@/lib/use-session-ready'
import { Dock, LoadingScreen, Navbar } from '@/components'

export const Route = createFileRoute('/messages')({ component: Messages })

function Messages() {
  const { session, isReady } = useSessionReady({ requireAuth: true })

  return (
    <>
      <Navbar />
      <Show when={isReady() && session().data} fallback={<LoadingScreen />}>
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24">
          <header class="flex flex-col gap-1">
            <h1 class="text-2xl font-semibold">Messages</h1>
          </header>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
            <aside class="rounded-box border border-base-300 bg-base-100 p-5">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold tracking-wide uppercase opacity-60">
                  Tutors
                </span>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-3"></div>
            </aside>
            <section class="flex h-full flex-col rounded-box border border-base-300 bg-base-100">
              <header class="flex items-center justify-between border-b border-base-300 px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="avatar avatar-placeholder">
                    <div class="w-16 rounded-full bg-neutral text-neutral-content">
                      <span class="text-lg font-semibold">AL</span>
                    </div>
                  </div>
                  <div class="flex flex-col">
                    <h2 class="text-lg font-semibold">Alicia Lane</h2>
                    <span class="text-xs tracking-wide uppercase opacity-60">
                      Offline
                    </span>
                  </div>
                </div>
              </header>
              <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div class="chat-start chat">
                  <div class="chat-header text-sm font-semibold opacity-80">
                    Alicia • 9:41 AM
                  </div>
                  <div class="chat-bubble bg-base-200">
                    Good morning! Can we sync on the onboarding walkthrough this
                    afternoon?
                  </div>
                </div>
                <div class="chat-end chat">
                  <div class="chat-header text-sm font-semibold opacity-80">
                    You • 9:44 AM
                  </div>
                  <div class="chat-bubble chat-bubble-primary">
                    Absolutely. I’ll have the updated flow ready by 2 PM. Does
                    that work?
                  </div>
                </div>
                <div class="chat-start chat">
                  <div class="chat-header text-sm font-semibold opacity-80">
                    Alicia • 9:46 AM
                  </div>
                  <div class="chat-bubble bg-base-200">
                    Perfect. Thanks for taking the lead on this!
                  </div>
                </div>
              </div>
              <footer class="px-4 py-3 sm:px-6">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  class="input"
                />
                <button class="btn btn-primary">Send</button>
              </footer>
            </section>
          </div>
        </section>
      </Show>
      <Dock />
    </>
  )
}
