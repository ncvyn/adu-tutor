import { For, Show, createEffect, createSignal } from 'solid-js'
import { SolidMarkdown } from 'solid-markdown'
import type { UserResult } from '@/components'
import { useChat } from '@/lib/use-chat'
import { getInitials } from '@/lib/helper'
import { markdownClass } from '@/lib/markdown'
import { unixToLocale } from '@/lib/format-date'

const THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

export const ChatPanel = (props: {
  senderId: string
  recipient: UserResult
}) => {
  const chat = useChat({
    senderId: props.senderId,
    recipientId: props.recipient.id,
  })

  const [input, setInput] = createSignal('')
  const [messageToDelete, setMessageToDelete] = createSignal<string | null>(
    null,
  )
  const [selectedDeleteMessageId, setSelectedDeleteMessageId] = createSignal<
    string | null
  >(null)

  let messagesEndRef: HTMLDivElement | undefined
  let deleteDialogRef: HTMLDialogElement | undefined

  createEffect(() => {
    if (isLoading() || messages().length == 0) return

    requestAnimationFrame(() => {
      messagesEndRef?.scrollIntoView({ behavior: 'auto' })
    })
  })

  const handleSend = () => {
    const content = input().trim()
    if (!content) return
    chat.send(content)
    setInput('')
  }

  const requestDelete = (messageId: string) => {
    setMessageToDelete(messageId)
    deleteDialogRef?.showModal()
  }

  const confirmDelete = () => {
    const id = messageToDelete()
    if (id) {
      chat.remove(id)
    }
    setMessageToDelete(null)
    deleteDialogRef?.close()
  }

  const cancelDelete = () => {
    setMessageToDelete(null)
    deleteDialogRef?.close()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    e.preventDefault()
    handleSend()
  }

  const messages = () => chat.messages()
  const isLoading = () => chat.isLoading()
  const isConnected = () => chat.isConnected()
  const isSending = () => chat.isSending()

  return (
    <section class="flex h-full min-h-0 flex-col rounded-box border border-base-300 bg-base-100">
      <header class="flex items-center justify-between border-b border-base-300 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-placeholder">
            <div class="w-12 rounded-full bg-neutral text-neutral-content">
              <span class="text-md font-semibold">
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

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
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

                  <div
                    class={isSender ? 'group chat-end chat' : 'chat-start chat'}
                  >
                    <Show when={showSeparator}>
                      <div class="chat-header pb-1 text-sm font-semibold opacity-80">
                        {isSender ? 'You' : props.recipient.name}
                      </div>
                    </Show>

                    <div
                      class="chat-bubble cursor-pointer wrap-break-word whitespace-normal"
                      classList={{
                        'chat-bubble-primary': isSender,
                        'bg-base-200': !isSender,
                      }}
                      onClick={() =>
                        isSender &&
                        setSelectedDeleteMessageId(
                          selectedDeleteMessageId() === msg.id ? null : msg.id,
                        )
                      }
                      tabIndex={isSender ? 0 : undefined}
                      aria-label={isSender ? 'Show delete' : undefined}
                    >
                      <div class={markdownClass}>
                        <SolidMarkdown>{msg.content}</SolidMarkdown>
                      </div>
                    </div>

                    <Show
                      when={isSender && selectedDeleteMessageId() === msg.id}
                    >
                      <div class="chat-footer flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedDeleteMessageId(null)
                            requestDelete(msg.id)
                          }}
                          class="cursor-pointer text-xs text-error hover:underline"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    </Show>
                  </div>
                </>
              )
            }}
          </For>

          <div ref={messagesEndRef} />
        </Show>
      </div>

      <footer class="flex gap-2 border-t border-base-300 px-4 py-3 sm:px-6">
        <textarea
          placeholder="Write a message..."
          class="textarea flex-1"
          rows={1}
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          class="btn self-end btn-primary"
          disabled={!input().trim() || (!isConnected() && isSending())}
          onClick={handleSend}
        >
          <Show
            when={!isSending()}
            fallback={<span class="loading loading-xs loading-spinner" />}
          >
            Send
          </Show>
        </button>
      </footer>

      {/* Delete Confirmation Dialog */}
      <dialog ref={deleteDialogRef} class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Delete message?</h3>
          <p class="py-2 text-sm opacity-70">
            Are you sure you want to delete this message? This action cannot be
            undone.
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost" onClick={cancelDelete}>
              Cancel
            </button>
            <button class="btn btn-error" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button onClick={cancelDelete}>close</button>
        </form>
      </dialog>
    </section>
  )
}
