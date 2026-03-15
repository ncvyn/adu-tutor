import { ErrorBoundary, Show, createMemo, createSignal } from 'solid-js'
import { createFileRoute } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { InfoCardWithVotes } from '@/schemas/info'
import { useAuthGuard } from '@/lib/auth-client'
import { LoadingScreen, useNotifications } from '@/components'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import {
  CardList,
  DeleteDialog,
  DiscardDialog,
  ErrorFallback,
  Filter,
  Header,
  ShareDialog,
  TutorSearch,
} from '@/components/info-hub'
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
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Show
            when={!cardsQuery.isPending || !!cardsQuery.data}
            fallback={<LoadingScreen />}
          >
            <div class="mx-auto my-8 w-full max-w-4xl px-4 pb-4">
              <TutorSearch />
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
            </div>
          </Show>
        </ErrorBoundary>

        <ShareDialog
          ref={(el) => {
            shareDialogRef = el
          }}
          allowClose={allowClose()}
          onRequestClose={requestCloseDialog}
          onAfterClose={() => setAllowClose(false)}
          title={newTitle()}
          content={newContent()}
          subjects={newSubjects()}
          isFormValid={isFormValid()}
          isPosting={createCardMutation.isPending}
          onTitleInput={setNewTitle}
          onContentInput={setNewContent}
          onToggleSubject={(subject) =>
            setNewSubjects((prev) =>
              prev.includes(subject)
                ? prev.filter((s) => s !== subject)
                : [...prev, subject],
            )
          }
          onSubmit={addCard}
        />

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
