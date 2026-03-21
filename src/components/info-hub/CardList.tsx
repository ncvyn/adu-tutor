import { For, Show, createSignal } from 'solid-js'
import { SolidMarkdown } from 'solid-markdown'
import type { InfoCardWithVotes } from '@/schemas/info'
import { markdownClass } from '@/lib/markdown'

interface CardListProps {
  cards: Array<InfoCardWithVotes>
  currentUserId: string
  onVote: (cardId: string, value: number) => void
  onRequestDelete: (id: string, title: string) => void
  onRequestEdit: (card: InfoCardWithVotes) => void
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
                      <div class="flex items-start justify-between gap-4">
                        <div>
                          <button
                            type="button"
                            class="text-left"
                            onClick={() => openDetails(card)}
                          >
                            <h2 class="card-title">{card.title}</h2>
                            <div class="flex items-center gap-2">
                              <p class="text-xs opacity-60">
                                by {card.authorName}
                              </p>
                              <For each={card.subjects}>
                                {(s) => (
                                  <span class="badge badge-soft badge-sm">
                                    {s}
                                  </span>
                                )}
                              </For>
                            </div>
                          </button>
                        </div>

                        <div class="dropdown dropdown-end">
                          <div
                            tabindex={0}
                            role="button"
                            class="btn btn-ghost btn-sm"
                            aria-label="Card actions"
                          >
                            ⋮
                          </div>
                          <ul
                            tabindex={0}
                            class="dropdown-content menu z-1 mt-2 w-40 rounded-box bg-base-100 p-2 shadow"
                          >
                            <li>
                              <button
                                type="button"
                                onClick={() => openDetails(card)}
                              >
                                View details
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => props.onRequestEdit(card)}
                              >
                                Edit
                              </button>
                            </li>
                            <Show when={card.authorId === props.currentUserId}>
                              <li>
                                <button
                                  type="button"
                                  class="text-error"
                                  onClick={() =>
                                    props.onRequestDelete(card.id, card.title)
                                  }
                                >
                                  Delete
                                </button>
                              </li>
                            </Show>
                          </ul>
                        </div>
                      </div>

                      <div class={markdownClass}>
                        <SolidMarkdown>{card.content}</SolidMarkdown>
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

              <div class="mb-4 flex items-center gap-2">
                <p class="text-sm opacity-70">by {card().authorName}</p>
                <span class="badge badge-outline">
                  Score: {card().score} • Vote: {card().userVote ?? 0}
                </span>
                <For each={card().subjects}>
                  {(subject) => (
                    <span class="badge badge-soft badge-sm">{subject}</span>
                  )}
                </For>
              </div>

              <div class="prose max-w-none">
                <div class={markdownClass}>
                  <SolidMarkdown>{card().content}</SolidMarkdown>
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
