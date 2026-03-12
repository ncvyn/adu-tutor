import { For, Show } from 'solid-js'
import { SolidMarkdown } from 'solid-markdown'
import type { InfoCardWithVotes } from '@/schemas/info'
import { markdownClass } from '@/lib/markdown'

interface InfoHubCardListProps {
  cards: Array<InfoCardWithVotes>
  currentUserId: string
  onVote: (cardId: string, value: number) => void
  onRequestDelete: (id: string, title: string) => void
}

export function InfoHubCardList(props: InfoHubCardListProps) {
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
                        class={`btn btn-ghost btn-xs ${card.userVote === 1 ? 'btn-active text-success' : ''}`}
                        disabled={card.authorId === props.currentUserId}
                        onClick={() => props.onVote(card.id, 1)}
                        title="Upvote"
                      >
                        ▲
                      </button>
                      <span class="text-sm font-bold">{card.score}</span>
                      <button
                        class={`btn btn-ghost btn-xs ${card.userVote === -1 ? 'btn-active text-error' : ''}`}
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
                        </div>
                        <Show when={card.authorId === props.currentUserId}>
                          <button
                            class="btn text-error btn-ghost btn-xs"
                            onClick={() =>
                              props.onRequestDelete(card.id, card.title)
                            }
                          >
                            Delete
                          </button>
                        </Show>
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
    </>
  )
}
