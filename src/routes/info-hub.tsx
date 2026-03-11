import { ErrorBoundary, For, Show, createMemo, createSignal } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
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

export const Route = createFileRoute('/info-hub')({
  ssr: false,
  component: InfoHub,
})

function InfoHubErrorFallback() {
  return (
    <div class="mx-auto my-8 w-full max-w-4xl px-4">
      <div class="alert alert-error">
        <span>Failed to load info cards.</span>
      </div>
    </div>
  )
}

function InfoHub() {
  const session = useAuthGuard({ requireAuth: true })
  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [newSubjects, setNewSubjects] = createSignal<Array<string>>(['General'])
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

  const [allowClose, setAllowClose] = createSignal(false)

  const cardsQuery = useQuery(() => ({
    queryKey: ['info-cards', session().data?.user.id] as const,
    enabled: !!session().data?.user.id,
    queryFn: async () => getInfoCards(),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  }))

  const createCardMutation = useMutation(() => ({
    mutationKey: ['info-card', 'create', session().data?.user.id] as const,
    mutationFn: async (payload: {
      title: string
      content: string
      subjects: Array<string>
    }) => createInfoCard({ data: payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['info-cards'] })
      closeShareDialog()
    },
    onError: (err) => {
      notify({
        type: 'error',
        message: `Error creating info card: ${String(err)}`,
      })
    },
  }))

  const deleteCardMutation = useMutation(() => ({
    mutationKey: ['info-card', 'delete', pendingDeleteId()] as const,
    mutationFn: async (id: string) => deleteInfoCard({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['info-cards'] })
      setPendingDeleteId(null)
      setPendingDeleteTitle(null)
      deleteDialogRef?.close()
    },
    onError: (err) => {
      notify({
        type: 'error',
        message: `Error deleting info card: ${String(err)}`,
      })
    },
  }))

  const voteMutation = useMutation(() => ({
    mutationKey: ['info-card', 'vote', session().data?.user.id] as const,
    mutationFn: async (payload: { cardId: string; value: number }) =>
      voteInfoCard({ data: payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['info-cards'] })
    },
    onError: (err) => {
      notify({
        type: 'error',
        message: `Error voting: ${String(err)}`,
      })
    },
  }))

  const cards = createMemo<Array<InfoCardWithVotes>>(
    () => cardsQuery.data ?? [],
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

  const isFormValid = createMemo(
    () => newTitle().trim().length > 0 && newContent().trim().length > 0,
  )

  const isDirty = createMemo(
    () => newTitle().trim().length > 0 || newContent().trim().length > 0,
  )

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

  async function addCard() {
    if (!isFormValid() || createCardMutation.isPending) return

    await createCardMutation.mutateAsync({
      title: newTitle().trim(),
      content: newContent().trim(),
      subjects: newSubjects(),
    })
  }

  function requestDeleteCard(id: string, title: string) {
    setPendingDeleteId(id)
    setPendingDeleteTitle(title)
    deleteDialogRef?.showModal()
  }

  async function confirmDeleteCard() {
    const id = pendingDeleteId()
    if (!id || deleteCardMutation.isPending) return
    await deleteCardMutation.mutateAsync(id)
  }

  function cancelDeleteCard() {
    setPendingDeleteId(null)
    setPendingDeleteTitle(null)
    deleteDialogRef?.close()
  }

  async function handleVote(cardId: string, value: number) {
    if (voteMutation.isPending) return
    await voteMutation.mutateAsync({ cardId, value })
  }

  return (
    <Show when={session().data} fallback={<LoadingScreen />}>
      <AuthenticatedLayout>
        <ErrorBoundary fallback={<InfoHubErrorFallback />}>
          <Show
            when={!cardsQuery.isPending || !!cardsQuery.data}
            fallback={<LoadingScreen />}
          >
            <div class="mx-auto my-8 w-full max-w-4xl px-4 pb-4">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold">Info Hub</h1>
                  <div class="flex items-center gap-2">
                    <p class="text-sm opacity-70">{cardCountLabel()}</p>
                    <Show when={cardsQuery.isFetching && !cardsQuery.isPending}>
                      <span class="loading loading-xs loading-spinner opacity-70" />
                    </Show>
                  </div>
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

              <Show when={filteredCards().length > 0}>
                <div class="space-y-4">
                  <For each={filteredCards()}>
                    {(card) => (
                      <div class="card bg-base-100 shadow card-border">
                        <div class="card-body">
                          <div class="flex items-start gap-4">
                            <div class="flex flex-col items-center gap-1">
                              <button
                                class={`btn btn-ghost btn-xs ${card.userVote === 1 ? 'btn-active text-success' : ''}`}
                                disabled={
                                  card.authorId === session().data!.user.id
                                }
                                onClick={() => handleVote(card.id, 1)}
                                title="Upvote"
                              >
                                ▲
                              </button>
                              <span class="text-sm font-bold">
                                {card.score}
                              </span>
                              <button
                                class={`btn btn-ghost btn-xs ${card.userVote === -1 ? 'btn-active text-error' : ''}`}
                                disabled={
                                  card.authorId === session().data!.user.id
                                }
                                onClick={() => handleVote(card.id, -1)}
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
                                <Show
                                  when={
                                    card.authorId === session().data!.user.id
                                  }
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

              <Show when={filteredCards().length === 0}>
                <div class="rounded-box border border-base-300 bg-base-100 p-8 text-center">
                  <p class="text-sm opacity-60">
                    No cards found for this filter.
                  </p>
                </div>
              </Show>
            </div>
          </Show>
        </ErrorBoundary>

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
                disabled={!isFormValid() || createCardMutation.isPending}
                onClick={addCard}
              >
                <Show
                  when={!createCardMutation.isPending}
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
                disabled={deleteCardMutation.isPending}
              >
                Cancel
              </button>
              <button
                class="btn btn-error"
                onClick={confirmDeleteCard}
                disabled={deleteCardMutation.isPending}
              >
                <Show
                  when={!deleteCardMutation.isPending}
                  fallback={<span class="loading loading-sm loading-spinner" />}
                >
                  Delete
                </Show>
              </button>
            </div>
          </div>
        </dialog>
      </AuthenticatedLayout>
    </Show>
  )
}
