import { For, Show, createEffect, createSignal, createMemo } from 'solid-js'
import type { UserResult } from '@/components/SearchUsers'
import { useChat } from '@/lib/use-chat'

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

  // Auto-scroll to bottom when new messages arrive
  createEffect(() => {
    chat().messages()
    const end = messagesEndRef
    if (end === undefined) return
    end.scrollIntoView({ behavior: 'smooth' })
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <section class="flex h-128 flex-col rounded-box border border-base-300 bg-base-100">
      {/* Header */}
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
            <span class="text-xs tracking-wide uppercase opacity-60">
              {chat().isConnected() ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div class="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <Show
          when={!chat().isLoading()}
          fallback={
            <div class="flex h-full items-center justify-center">
              <span class="loading loading-md loading-spinner" />
            </div>
          }
        >
          <Show when={chat().messages().length === 0}>
            <div class="flex h-full items-center justify-center">
              <p class="text-sm opacity-60">No messages yet. Say hello!</p>
            </div>
          </Show>
          <For each={chat().messages()}>
            {(msg) => {
              const isSender = msg.senderId === props.senderId
              return (
                <div class={isSender ? 'chat-end chat' : 'chat-start chat'}>
                  <div class="chat-header text-sm font-semibold opacity-80">
                    {isSender ? 'You' : props.recipient.name}
                    {' • '}
                    {formatTime(msg.createdAt)}
                  </div>
                  <div
                    class="chat-bubble"
                    classList={{
                      'chat-bubble-primary': isSender,
                      'bg-base-200': !isSender,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            }}
          </For>
          <div ref={messagesEndRef} />
        </Show>
      </div>

      {/* Input */}
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
          disabled={!input().trim() || !chat().isConnected()}
          onClick={handleSend}
        >
          Send
        </button>
      </footer>
    </section>
  )
}
