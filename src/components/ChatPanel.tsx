import { For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import type { UserResult } from '@/components'
import { useChat } from '@/lib/use-chat'

const THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

export const ChatPanel = (props: {
  senderId: string
  recipient: UserResult
}) => {
  const chat = createMemo(() =>
    useChat({
      senderId: props.senderId,
      recipientId: props.recipient.id,
    }),
  )

  const [input, setInput] = createSignal('')
  let messagesEndRef: HTMLDivElement | undefined

  createEffect(() => {
    chat().messages()
    messagesEndRef?.scrollIntoView({ behavior: 'smooth' })
  })

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const handleSend = () => {
    const content = input().trim()
    if (!content) return
    chat().send(content)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    e.preventDefault()
    handleSend()
  }

  const unixToLocale = (timestamp: number) => {
    const ts = new Date(timestamp)

    const date =
      ts.toDateString() === new Date().toDateString()
        ? 'Today'
        : ts.toLocaleDateString([], {
            month: 'short',
            day: '2-digit',
          })
    const time = new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    return `${date}, ${time}`
  }

  const messages = () => chat().messages()
  const isLoading = () => chat().isLoading()
  const isConnected = () => chat().isConnected()

  return (
    <section class="flex h-128 flex-col rounded-box border border-base-300 bg-base-100">
      <header class="flex items-center justify-between border-b border-base-300 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-placeholder">
            <div class="w-12 rounded-full bg-neutral text-neutral-content">
              <span class="text-sm font-semibold">
                {getInitials(props.recipient.name)}
              </span>
            </div>
          </div>
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold">{props.recipient.name}</h2>
            <div class="flex flex-row items-center gap-2">
              <Show
                when={!isConnected()}
                fallback={<div class="status status-success"></div>}
              >
                <div class="inline-grid *:[grid-area:1/1]">
                  <div class="status animate-ping status-warning"></div>
                  <div class="status status-warning"></div>
                </div>
              </Show>
              <span class="text-xs tracking-wide uppercase opacity-60">
                {isConnected() ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-6">
        <Show
          when={!isLoading()}
          fallback={
            <div class="flex h-full items-center justify-center">
              <span class="loading loading-md loading-spinner" />
            </div>
          }
        >
          <Show when={messages().length === 0}>
            <div class="flex h-full items-center justify-center">
              <p class="text-sm opacity-60">No messages yet. Say hello!</p>
            </div>
          </Show>

          <For each={messages()}>
            {(msg, i) => {
              const prevMsg = i() > 0 ? messages()[i() - 1] : undefined
              const isSender = msg.senderId === props.senderId

              const msgTs = new Date(msg.createdAt).getTime()
              const prevTs =
                prevMsg !== undefined
                  ? new Date(prevMsg.createdAt).getTime()
                  : undefined

              const showSeparator =
                !prevTs ||
                new Date(prevTs).toDateString() !==
                  new Date(msgTs).toDateString() ||
                msgTs - prevTs > THRESHOLD_MS

              return (
                <>
                  <Show when={showSeparator}>
                    <div class="my-4 flex items-center">
                      <div class="flex-1 border-t border-base-300" />
                      <span class="mx-4 text-xs text-base-content/60">
                        {unixToLocale(msgTs)}
                      </span>
                      <div class="flex-1 border-t border-base-300" />
                    </div>
                  </Show>

                  <div class={isSender ? 'chat-end chat' : 'chat-start chat'}>
                    <Show when={showSeparator}>
                      <div class="chat-header pb-1 text-sm font-semibold opacity-80">
                        {isSender ? 'You' : props.recipient.name}
                      </div>
                    </Show>
                    <div
                      class="chat-bubble break-all"
                      classList={{
                        'chat-bubble-primary': isSender,
                        'bg-base-200': !isSender,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </>
              )
            }}
          </For>

          <div ref={messagesEndRef} />
        </Show>
      </div>

      <footer class="flex gap-2 border-t border-base-300 px-4 py-3 sm:px-6">
        <input
          type="text"
          placeholder="Write a message..."
          class="input flex-1"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          class="btn btn-primary"
          disabled={!input().trim() || !isConnected()}
          onClick={handleSend}
        >
          Send
        </button>
      </footer>
    </section>
  )
}
