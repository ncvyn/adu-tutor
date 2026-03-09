import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { SolidMarkdown } from 'solid-markdown'
import type { InfoCardWithVotes } from '@/schemas/info'
import { useAuthGuard } from '@/lib/auth-client'
import { LoadingScreen, useNotifications } from '@/components'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import { markdownClass } from '@/lib/markdown'
import { SUBJECTS } from '@/lib/constants'
import {
  createInfoCard,
  deleteInfoCard,
  getInfoCards,
  voteInfoCard,
} from '@/server/info-cards.functions'

export const Route = createFileRoute('/info-hub')({ component: InfoHub })

function InfoHub() {
  const session = useAuthGuard({ requireAuth: true })
  const { notify } = useNotifications()

  const [cards, setCards] = createSignal<Array<InfoCardWithVotes>>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [newSubjects, setNewSubjects] = createSignal<string[]>(['General'])
  const [isSaving, setIsSaving] = createSignal(false)
  const [filterSubject, setFilterSubject] = createSignal<string>('All')

  let shareDialogRef: HTMLDialogElement | undefined
  let confirmDialogRef: HTMLDialogElement | undefined
  let deleteDialogRef: HTMLDialogElement | undefined

  const [pendingDeleteId, setPendingDeleteId] = createSignal<string | null>(
    null,
  )
  const [pendingDeleteTitle, setPendingDeleteTitle] = createSignal<
    string | null
  >(null)
  const [isDeleting, setIsDeleting] = createSignal(false)

  const isFormValid = createMemo(
    () => newTitle().trim().length > 0 && newContent().trim().length > 0,
  )

  const filteredCards = createMemo(() => {
    const subject = filterSubject()
    if (subject === 'All') return cards()
    return cards().filter((card) => card.subjects.includes(subject))
  })

  const cardCountLabel = createMemo(() => {
    const count = filteredCards().length
    return count === 1 ? '1 card' : `${count} cards`
  })

  const isDirty = createMemo(
    () => newTitle().trim().length > 0 || newContent().trim().length > 0,
  )

  const [allowClose, setAllowClose] = createSignal(false)

  function resetForm() {
    setNewTitle('')
    setNewContent('')
    setNewSubjects(['General'])
  }

  function openShareDialog() {
    shareDialogRef?.showModal()
  }

  function closeShareDialog() {
    setAllowClose(true)
    shareDialogRef?.close()
    resetForm()
  }

  function requestCloseDialog() {
    if (!isDirty()) {
      closeShareDialog()
      return
    }

    confirmDialogRef?.showModal()
  }

  function confirmDiscard() {
    confirmDialogRef?.close()
    closeShareDialog()
  }

  function cancelDiscard() {
    confirmDialogRef?.close()
  }

  async function fetchCards() {
    try {
      const result = await getInfoCards()
      setCards(result)
    } catch (err) {
      notify({ type: 'error', message: `Error fetching info cards: ${err}` })
    } finally {
      setIsLoading(false)
    }
  }

  onMount(() => {
    fetchCards()
  })

  async function addCard() {
    if (!isFormValid() || isSaving()) return

    setIsSaving(true)

    try {
      const newCard = await createInfoCard({
        data: {
          title: newTitle().trim(),
          content: newContent().trim(),
          subjects: newSubjects(),
        },
      })

      setCards((prev) => [newCard, ...prev])
      closeShareDialog()
    } catch (err) {
      notify({ type: 'error', message: `Error creating info card: ${err}` })
    } finally {
      setIsSaving(false)
    }
  }

  function requestDeleteCard(id: string, title: string) {
    setPendingDeleteId(id)
    setPendingDeleteTitle(title)
    deleteDialogRef?.showModal()
  }

  function confirmDeleteCard() {
    const id = pendingDeleteId()
    if (!id) return
    setIsDeleting(true)
    deleteInfoCard({ data: { id } })
      .then(() => {
        setCards((prev) => prev.filter((card) => card.id !== id))
        setPendingDeleteId(null)
        setPendingDeleteTitle(null)
        deleteDialogRef?.close()
      })
      .catch((err) => {
        notify({ type: 'error', message: `Error deleting info card: ${err}` })
      })
      .finally(() => setIsDeleting(false))
  }

  function cancelDeleteCard() {
    setPendingDeleteId(null)
    setPendingDeleteTitle(null)
    deleteDialogRef?.close()
  }

  async function handleVote(cardId: string, value: number) {
    try {
      const result = await voteInfoCard({ data: { cardId, value } })

      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card

          const oldVote = card.userVote ?? 0
          const newVote = result.userVote ?? 0
          const scoreDiff = newVote - oldVote

          return {
            ...card,
            score: card.score + scoreDiff,
            userVote: result.userVote,
          }
        }),
      )
    } catch (err) {
      notify({ type: 'error', message: `Error voting: ${err}` })
    }
  }

  return (
    <AuthenticatedLayout>
      <Show when={session().data} fallback={<LoadingScreen />}>
        <div class="mx-auto my-8 w-full max-w-4xl px-4 pb-4">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold">Info Hub</h1>
              <p class="text-sm opacity-70">{cardCountLabel()}</p>
            </div>

            <button class="btn btn-primary" onClick={openShareDialog}>
              Share Info
            </button>
          </div>

          <div class="mb-4">
            <select
              class="select-bordered select w-full max-w-xs"
              value={filterSubject()}
              onChange={(e) => setFilterSubject(e.currentTarget.value)}
            >
              <option value="All">All Subjects</option>
              <For each={SUBJECTS}>
                {(subject) => <option value={subject}>{subject}</option>}
              </For>
            </select>
          </div>

          <Show when={!isLoading()} fallback={<LoadingScreen />}>
            <div class="space-y-4">
              <For each={filteredCards()}>
                {(card) => (
                  <div class="card bg-base-100 shadow card-border">
                    <div class="card-body">
                      <div class="flex items-start gap-4">
                        {/* Voting column */}
                        <div class="flex flex-col items-center gap-1">
                          <button
                            class={`btn btn-ghost btn-xs ${card.userVote === 1 ? 'btn-active text-success' : ''}`}
                            disabled={card.authorId === session().data!.user.id}
                            onClick={() => handleVote(card.id, 1)}
                            title="Upvote"
                          >
                            ▲
                          </button>
                          <span class="text-sm font-bold">{card.score}</span>
                          <button
                            class={`btn btn-ghost btn-xs ${card.userVote === -1 ? 'btn-active text-error' : ''}`}
                            disabled={card.authorId === session().data!.user.id}
                            onClick={() => handleVote(card.id, -1)}
                            title="Downvote"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Card content */}
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
                                    <span class="badge badge-outline badge-sm">
                                      {s}
                                    </span>
                                  )}
                                </For>
                              </div>
                            </div>
                            <Show
                              when={card.authorId === session().data!.user.id}
                            >
                              <button
                                class="btn text-error btn-ghost btn-xs"
                                onClick={() =>
                                  requestDeleteCard(card.id, card.title)
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
        </div>
      </Show>

      <dialog
        ref={shareDialogRef}
        class="modal"
        onClose={() => {
          if (!allowClose()) requestCloseDialog()
          setAllowClose(false)
        }}
      >
        <div class="modal-box">
          <h3 class="text-lg font-bold">Share...</h3>

          <div class="mt-4 space-y-3">
            <fieldset class="fieldset w-full">
              <legend class="fieldset-legend">Title</legend>
              <input
                class="input-bordered input w-full"
                value={newTitle()}
                onInput={(e) => setNewTitle(e.currentTarget.value)}
                placeholder="e.g. Algebra reviewer tips"
              />
            </fieldset>

            <fieldset class="fieldset w-full">
              <legend class="fieldset-legend">Subjects</legend>
              <div class="flex flex-wrap gap-2">
                <For each={SUBJECTS}>
                  {(subject) => (
                    <label class="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm checkbox-primary"
                        checked={newSubjects().includes(subject)}
                        onInput={() =>
                          setNewSubjects((prev) =>
                            prev.includes(subject)
                              ? prev.filter((s) => s !== subject)
                              : [...prev, subject],
                          )
                        }
                      />
                      <span class="text-sm">{subject}</span>
                    </label>
                  )}
                </For>
              </div>
            </fieldset>

            <fieldset class="fieldset w-full">
              <legend class="fieldset-legend">Content</legend>
              <textarea
                class="textarea-bordered textarea min-h-32 w-full"
                value={newContent()}
                onInput={(e) => setNewContent(e.currentTarget.value)}
                placeholder={
                  'Use **bold**, *italics*, lists, and [links](https://...)'
                }
              />
            </fieldset>
          </div>

          <div class="modal-action">
            <button class="btn btn-ghost" onClick={requestCloseDialog}>
              Cancel
            </button>
            <button
              class="btn btn-primary"
              disabled={!isFormValid() || isSaving()}
              onClick={addCard}
            >
              <Show
                when={!isSaving()}
                fallback={<span class="loading loading-sm loading-spinner" />}
              >
                Post
              </Show>
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={confirmDialogRef} class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Discard draft?</h3>
          <p class="py-2 text-sm opacity-70">
            You have unsaved content. Do you want to discard it?
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost" onClick={cancelDiscard}>
              Keep editing
            </button>
            <button class="btn btn-error" onClick={confirmDiscard}>
              Discard
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={deleteDialogRef} class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Delete info card?</h3>
          <p class="py-2 text-sm opacity-70">
            Are you sure you want to delete "<b>{pendingDeleteTitle()}</b>"?
            This action cannot be undone.
          </p>
          <div class="modal-action">
            <button
              class="btn btn-ghost"
              onClick={cancelDeleteCard}
              disabled={isDeleting()}
            >
              Cancel
            </button>
            <button
              class="btn btn-error"
              onClick={confirmDeleteCard}
              disabled={isDeleting()}
            >
              <Show
                when={!isDeleting()}
                fallback={<span class="loading loading-sm loading-spinner" />}
              >
                Delete
              </Show>
            </button>
          </div>
        </div>
      </dialog>
    </AuthenticatedLayout>
  )
}
