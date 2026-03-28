import { For, Show, createSignal } from 'solid-js'
import { SolidMarkdown } from 'solid-markdown'
import { Pen, Trash2 } from 'lucide-solid'
import type { InfoCardWithVotes } from '@/schemas/info'
import { markdownClass } from '@/lib/markdown'
import type { JSX } from 'solid-js'

interface CardListProps {
  cards: Array<InfoCardWithVotes>
  currentUserId: string
  onVote: (cardId: string, value: number) => void
  onRequestDelete: (id: string, title: string) => void
  onRequestEdit: (card: InfoCardWithVotes) => void
}

const PREVIEW_LENGTH = 128
const PREVIEW_LINES = 4
function getPreviewContent(content: string) {
  const trimmed = content
    .trim()
    .split(/\r?\n/)
    .slice(0, PREVIEW_LINES)
    .join('\n')

  if (trimmed.length <= PREVIEW_LENGTH) return trimmed
  return `${trimmed.slice(0, PREVIEW_LENGTH).trimEnd()}...`
}

export function CardList(props: CardListProps) {
  const [selectedCard, setSelectedCard] =
    createSignal<InfoCardWithVotes | null>(null)

  function openDetails(card: InfoCardWithVotes) {
    setSelectedCard(card)
  }

  function closeDetails() {
    setSelectedCard(null)
  }

  function Link(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
    return (
      <a
        {...props}
        class={'text-secondary underline'}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    )
  }

  return (
    <>
      <Show when={props.cards.length > 0}>
        <div class="space-y-4">
          <For each={props.cards}>
            {(card) => (
              <div class="card bg-base-100 shadow card-border">
                <div class="card-body">
                  <div class="flex items-start gap-4">
                    <div class="flex flex-col items-center gap-1">
                      <button
                        class={`btn btn-ghost btn-xs ${
                          card.userVote === 1 ? 'btn-active text-success' : ''
                        }`}
                        disabled={card.authorId === props.currentUserId}
                        onClick={() => props.onVote(card.id, 1)}
                        title="Upvote"
                      >
                        ▲
                      </button>
                      <span class="text-sm font-bold">{card.score}</span>
                      <button
                        class={`btn btn-ghost btn-xs ${
                          card.userVote === -1 ? 'btn-active text-error' : ''
                        }`}
                        disabled={card.authorId === props.currentUserId}
                        onClick={() => props.onVote(card.id, -1)}
                        title="Downvote"
                      >
                        ▼
                      </button>
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex w-full items-start justify-between gap-4">
                        <div class="min-w-0 flex-1">
                          <button
                            type="button"
                            class="w-full text-left"
                            onClick={() => openDetails(card)}
                          >
                            <h2 class="card-title wrap-break-word">
                              {card.title}
                            </h2>
                            <div class="flex flex-wrap items-center gap-2">
                              <p class="text-xs opacity-60">
                                by {card.authorName}
                              </p>
                            </div>
                          </button>

                          <div class="mt-3 prose w-full max-w-none overflow-hidden">
                            <div class={`overflow-x-auto ${markdownClass}`}>
                              <SolidMarkdown
                                class="wrap-anywhere"
                                components={{ a: Link }}
                              >
                                {getPreviewContent(card.content)}
                              </SolidMarkdown>
                            </div>
                          </div>

                          <Show when={card.content.length > PREVIEW_LENGTH}>
                            <button
                              type="button"
                              class="btn mt-1 px-0 btn-ghost btn-sm"
                              onClick={() => openDetails(card)}
                            >
                              Read more...
                            </button>
                          </Show>
                        </div>

                        <div class="flex shrink-0 flex-col items-end justify-center gap-2">
                          <div class="flex flex-row justify-end gap-1">
                            <For each={card.subjects}>
                              {(s) => (
                                <span class="badge badge-soft badge-sm">
                                  {s}
                                </span>
                              )}
                            </For>
                          </div>
                          <Show when={card.authorId === props.currentUserId}>
                            <>
                              <button
                                type="button"
                                class="btn gap-1 btn-ghost btn-xs"
                                onClick={() => props.onRequestEdit(card)}
                                title="Edit"
                              >
                                <Pen class="h-4 w-4" />
                                <span class="hidden sm:inline">Edit</span>
                              </button>

                              <button
                                type="button"
                                class="btn gap-1 text-error btn-ghost btn-xs"
                                onClick={() =>
                                  props.onRequestDelete(card.id, card.title)
                                }
                                title="Delete"
                              >
                                <Trash2 class="h-4 w-4" />
                                <span class="hidden sm:inline">Delete</span>
                              </button>
                            </>
                          </Show>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={props.cards.length === 0}>
        <div class="rounded-box border border-base-300 bg-base-100 p-8 text-center">
          <p class="text-sm opacity-60">No cards found for this filter.</p>
        </div>
      </Show>

      <Show when={selectedCard()}>
        {(card) => (
          <div class="modal-open modal">
            <div class="modal-box max-w-2xl">
              <button
                class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
                type="button"
                onClick={closeDetails}
                aria-label="Close details"
              >
                ✕
              </button>

              <h3 class="mb-2 text-lg font-bold">{card().title}</h3>

              <div class="mb-4 flex flex-wrap items-center gap-2">
                <p class="text-sm opacity-70">by {card().authorName}</p>
                <span class="badge badge-outline">Score: {card().score}</span>
                <For each={card().subjects}>
                  {(subject) => (
                    <span class="badge badge-soft badge-sm">{subject}</span>
                  )}
                </For>
              </div>

              <div class="prose w-full max-w-none overflow-hidden wrap-break-word">
                <div class={`overflow-x-auto ${markdownClass}`}>
                  <SolidMarkdown components={{ a: Link }}>
                    {card().content}
                  </SolidMarkdown>
                </div>
              </div>
            </div>

            <div class="modal-backdrop" onClick={closeDetails}></div>
          </div>
        )}
      </Show>
    </>
  )
}
