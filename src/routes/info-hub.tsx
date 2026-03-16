import { ErrorBoundary, For, Show, createMemo, createSignal } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { InfoCardWithVotes } from '@/schemas/info'
import { useAuthGuard } from '@/lib/auth-client'
import { SUBJECTS } from '@/lib/constants'

import { LoadingScreen, useNotifications } from '@/components'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import {
  CardList,
  DeleteDialog,
  DiscardDialog,
  ErrorFallback,
  Filter,
  Header,
} from '@/components/info-hub'

import { Plus, Search, Share } from 'lucide-solid'

import {
  createInfoCard,
  deleteInfoCard,
  getInfoCards,
  voteInfoCard,
} from '@/server/info-cards.functions'
import { searchTutors } from '@/server/search-users.functions'

export const Route = createFileRoute('/info-hub')({
  ssr: false,
  component: InfoHub,
})

function InfoHub() {
  const session = useAuthGuard({ requireAuth: true })
  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  // Share Dialog State
  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [newSubjects, setNewSubjects] = createSignal<Array<string>>(['General'])
  const [filterSubject, setFilterSubject] = createSignal<string>('All')
  const [allowClose, setAllowClose] = createSignal(false)

  // Quick Dial State
  const [tutorSearchQuery, setTutorSearchQuery] = createSignal('')
  const [tutorSearchInput, setTutorSearchInput] = createSignal('')
  const [isTutorSearchModalOpen, setIsTutorSearchModalOpen] =
    createSignal(false)

  let shareDialogRef: HTMLDialogElement | undefined
  let confirmDialogRef: HTMLDialogElement | undefined
  let deleteDialogRef: HTMLDialogElement | undefined

  const [pendingDeleteId, setPendingDeleteId] = createSignal<string | null>(
    null,
  )
  const [pendingDeleteTitle, setPendingDeleteTitle] = createSignal<
    string | null
  >(null)

  const cardsQuery = useQuery(() => ({
    queryKey: ['info-cards', session().data?.user.id] as const,
    enabled: !!session().data?.user.id,
    queryFn: async () => getInfoCards(),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  }))

  const tutorsQuery = useQuery(() => ({
    queryKey: ['search-tutors', tutorSearchQuery()],
    queryFn: async () => {
      if (!tutorSearchQuery().trim()) return []
      return searchTutors({ data: tutorSearchQuery() })
    },
    enabled: () => !!tutorSearchQuery().trim(),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
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
      notify({ type: 'error', message: `Error voting: ${String(err)}` })
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

  // ========================
  // Share Dialog Handlers
  // ========================

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

  // ========================
  // Tutor Search Handlers
  // ========================

  function handleTutorSearchInput(e: Event) {
    setTutorSearchInput((e.target as HTMLInputElement).value)
  }

  function handleTutorSearch(e: Event) {
    e.preventDefault()
    const trimmed = tutorSearchInput().trim()
    if (trimmed) {
      setTutorSearchQuery(trimmed)
    }
  }

  function openTutorSearchModal() {
    setIsTutorSearchModalOpen(true)
    setTutorSearchInput('')
    setTutorSearchQuery('')
  }

  function closeTutorSearchModal() {
    setIsTutorSearchModalOpen(false)
    setTutorSearchInput('')
    setTutorSearchQuery('')
  }

  // ========================
  // Card Handlers
  // ========================

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
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Show
            when={!cardsQuery.isPending || !!cardsQuery.data}
            fallback={<LoadingScreen />}
          >
            <div class="mx-auto my-8 w-full max-w-4xl px-4 pb-4">
              <Header
                cardCountLabel={cardCountLabel()}
                isRefreshing={cardsQuery.isFetching && !cardsQuery.isPending}
                onShare={openShareDialog}
              />

              <Filter value={filterSubject()} onChange={setFilterSubject} />

              <CardList
                cards={filteredCards()}
                currentUserId={session().data!.user.id}
                onVote={handleVote}
                onRequestDelete={requestDeleteCard}
              />

              <div class="fixed right-8 bottom-8 z-50">
                <div class="fab">
                  <div
                    tabindex={0}
                    role="button"
                    class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0"
                    aria-label="Open quick actions"
                  >
                    <Plus />
                  </div>

                  <button
                    class="btn btn-circle btn-lg"
                    type="button"
                    onClick={openShareDialog}
                    aria-label="Share info"
                    title="Share Info"
                  >
                    <Share />
                  </button>

                  <button
                    class="btn btn-circle btn-lg"
                    type="button"
                    onClick={openTutorSearchModal}
                    aria-label="Search tutors"
                    title="Search Tutors"
                  >
                    <Search />
                  </button>
                </div>
              </div>

              <Show when={isTutorSearchModalOpen()}>
                <div class="modal-open modal">
                  <div class="modal-box">
                    <button
                      class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
                      type="button"
                      onClick={closeTutorSearchModal}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                    <h3 class="mb-4 text-lg font-bold">Search for Tutors</h3>
                    <form
                      onSubmit={handleTutorSearch}
                      class="mb-4 flex items-center gap-2"
                      autocomplete="off"
                    >
                      <input
                        type="text"
                        class="input-bordered input w-full"
                        placeholder="Type tutor name..."
                        value={tutorSearchInput()}
                        onInput={handleTutorSearchInput}
                        autofocus
                      />
                      <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={!tutorSearchInput().trim()}
                      >
                        Search
                      </button>
                    </form>

                    <Show when={tutorSearchQuery()}>
                      <Show when={tutorsQuery.isFetching}>
                        <div class="text-sm text-gray-500">Searching...</div>
                      </Show>
                      <Show when={!tutorsQuery.isFetching && tutorsQuery.data}>
                        <Show
                          when={tutorsQuery.data!.length > 0}
                          fallback={<div>No tutors found.</div>}
                        >
                          <ul class="menu mt-2 rounded-box bg-base-200">
                            <For each={tutorsQuery.data}>
                              {(tutor) => (
                                <li>
                                  <span>{tutor.name}</span>
                                </li>
                              )}
                            </For>
                          </ul>
                        </Show>
                      </Show>
                    </Show>
                  </div>
                  <div
                    class="modal-backdrop"
                    onClick={closeTutorSearchModal}
                  ></div>
                </div>
              </Show>

              <dialog
                ref={(el) => {
                  shareDialogRef = el
                }}
                class="modal"
                onClose={() => {
                  if (!allowClose()) setAllowClose(true)
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
                        fallback={
                          <span class="loading loading-sm loading-spinner" />
                        }
                      >
                        Post
                      </Show>
                    </button>
                  </div>
                </div>
              </dialog>
            </div>
          </Show>
        </ErrorBoundary>

        <DiscardDialog
          ref={(el) => {
            confirmDialogRef = el
          }}
          onKeepEditing={cancelDiscard}
          onDiscard={confirmDiscard}
        />

        <DeleteDialog
          ref={(el) => {
            deleteDialogRef = el
          }}
          title={pendingDeleteTitle()}
          isDeleting={deleteCardMutation.isPending}
          onCancel={cancelDeleteCard}
          onConfirm={confirmDeleteCard}
        />
      </AuthenticatedLayout>
    </Show>
  )
}
