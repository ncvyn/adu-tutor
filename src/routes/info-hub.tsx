import { createFileRoute } from '@tanstack/solid-router'
import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import type { InfoCard } from '@/schemas/info'
import { useAuthGuard } from '@/lib/auth-client'
import { Dock, LoadingScreen, Navbar, useNotifications } from '@/components'
import {
  createInfoCard,
  deleteInfoCard,
  getInfoCards,
} from '@/server/info-cards.functions'

export const Route = createFileRoute('/info-hub')({ component: InfoHub })

function InfoHub() {
  const session = useAuthGuard({ requireAuth: true })
  const { notify } = useNotifications()

  const [cards, setCards] = createSignal<Array<InfoCard>>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [isSaving, setIsSaving] = createSignal(false)

  let shareDialogRef: HTMLDialogElement | undefined
  let confirmDialogRef: HTMLDialogElement | undefined

  const isFormValid = createMemo(
    () => newTitle().trim().length > 0 && newContent().trim().length > 0,
  )

  const cardCountLabel = createMemo(() => {
    const count = cards().length
    return count === 1 ? '1 card' : `${count} cards`
  })

  const isDirty = createMemo(
    () => newTitle().trim().length > 0 || newContent().trim().length > 0,
  )

  const [allowClose, setAllowClose] = createSignal(false)

  function resetForm() {
    setNewTitle('')
    setNewContent('')
  }

  function openShareDialog() {
    shareDialogRef?.showModal()
  }

  function closeShareDialog() {
    setAllowClose(true)
    shareDialogRef?.close()
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

  async function handleDeleteCard(id: string) {
    try {
      await deleteInfoCard({ data: { id } })
      setCards((prev) => prev.filter((card) => card.id !== id))
    } catch (err) {
      notify({ type: 'error', message: `Error deleting info card: ${err}` })
    }
  }

  return (
    <div class="flex h-dvh flex-col bg-base-200/30">
      <Navbar />

      <Show when={session().data} fallback={<LoadingScreen />}>
        {(data) => (
          <>
            <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24">
              <div class="space-y-6">
                <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 class="text-2xl font-bold sm:text-3xl">Info Hub</h1>
                      <p class="mt-1 text-sm text-base-content/70 sm:text-base">
                        Share your knowledge with others via cards!
                      </p>
                      <p class="mt-2 text-xs font-medium tracking-wide text-base-content/60 uppercase">
                        {cardCountLabel()}
                      </p>
                    </div>

                    <button
                      class="btn btn-primary"
                      onClick={openShareDialog}
                      aria-label="Share new info card"
                    >
                      + Share to the Info Hub...
                    </button>
                  </div>
                </section>

                <Show
                  when={!isLoading()}
                  fallback={
                    <section class="flex justify-center py-10">
                      <span class="loading loading-lg loading-spinner" />
                    </section>
                  }
                >
                  <Show
                    when={cards().length > 0}
                    fallback={
                      <section class="rounded-box border border-dashed border-base-300 bg-base-100 p-10 text-center">
                        <h2 class="text-lg font-semibold">
                          No shared cards yet.
                        </h2>
                        <p class="mt-2 text-sm text-base-content/70">
                          Be the first to share a helpful card with the
                          community.
                        </p>
                      </section>
                    }
                  >
                    <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <For each={cards()}>
                        {(card) => (
                          <article class="card h-full border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
                            <div class="card-body">
                              <div class="mb-2 flex items-start justify-between gap-3">
                                <h2 class="card-title line-clamp-2 text-base sm:text-lg">
                                  {card.title}
                                </h2>
                                <span class="badge badge-outline badge-sm">
                                  Note
                                </span>
                              </div>

                              <p class="line-clamp-4 text-sm text-base-content/80">
                                {card.content}
                              </p>

                              <div class="mt-auto card-actions items-center justify-between pt-4">
                                <div class="flex flex-col gap-0.5">
                                  <span class="text-xs font-medium text-base-content/70">
                                    {card.authorName}
                                  </span>
                                  <time class="text-xs text-base-content/60">
                                    {card.createdAt.toLocaleDateString()}
                                  </time>
                                </div>

                                <Show when={card.authorId === data().user.id}>
                                  <button
                                    class="btn text-error btn-ghost btn-sm hover:bg-error/10"
                                    onClick={() => handleDeleteCard(card.id)}
                                    aria-label={`Delete card ${card.title}`}
                                  >
                                    Delete
                                  </button>
                                </Show>
                              </div>
                            </div>
                          </article>
                        )}
                      </For>
                    </section>
                  </Show>
                </Show>
              </div>
            </main>

            <dialog
              id="share_info_modal"
              class="modal"
              ref={(el) => {
                shareDialogRef = el
              }}
              onClose={() => {
                if (allowClose()) {
                  resetForm()
                  setAllowClose(false)
                  return
                }

                if (isDirty()) {
                  queueMicrotask(() => shareDialogRef?.showModal())
                  confirmDialogRef?.showModal()
                  return
                }

                resetForm()
              }}
            >
              <div class="modal-box max-w-xl">
                <h3 class="text-lg font-bold">Create an info card</h3>
                <p class="mt-1 text-sm text-base-content/70">
                  Share something insightful...
                </p>

                <div class="mt-5 space-y-4">
                  <fieldset class="fieldset">
                    <label class="fieldset-legend" for="card-title">
                      Title
                    </label>
                    <input
                      id="card-title"
                      class="input-bordered input w-full"
                      type="text"
                      placeholder="e.g. Inverse Kinematics explained"
                      value={newTitle()}
                      onInput={(e) => setNewTitle(e.currentTarget.value)}
                    />
                  </fieldset>

                  <fieldset class="fieldset">
                    <label class="fieldset-legend" for="card-content">
                      Content
                    </label>
                    <textarea
                      id="card-content"
                      class="textarea-bordered textarea min-h-32 w-full"
                      placeholder="Write important details here..."
                      value={newContent()}
                      onInput={(e) => setNewContent(e.currentTarget.value)}
                    />
                  </fieldset>
                </div>

                <div class="modal-action">
                  <button class="btn btn-ghost" onClick={requestCloseDialog}>
                    Cancel
                  </button>
                  <button
                    class="btn btn-primary"
                    onClick={addCard}
                    disabled={!isFormValid() || isSaving()}
                    classList={{ loading: isSaving() }}
                  >
                    Share Card
                  </button>
                </div>
              </div>

              <button
                aria-label="Close modal"
                class="modal-backdrop"
                onClick={requestCloseDialog}
              >
                close
              </button>
            </dialog>

            <dialog
              id="confirm_discard_modal"
              class="modal"
              ref={(el) => {
                confirmDialogRef = el
              }}
            >
              <div class="modal-box max-w-sm">
                <h3 class="text-lg font-bold">Discard draft?</h3>
                <p class="mt-2 text-sm text-base-content/70">
                  You have unsent content. Do you want to discard your draft and
                  close?
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

              <button
                aria-label="Close confirmation"
                class="modal-backdrop"
                onClick={cancelDiscard}
              >
                close
              </button>
            </dialog>
          </>
        )}
      </Show>

      <Dock />
    </div>
  )
}
