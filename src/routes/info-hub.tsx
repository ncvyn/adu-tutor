import { ErrorBoundary, Show, createMemo, createSignal } from 'solid-js'
import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { InfoCardWithVotes } from '@/schemas/info'
import { useAuthGuard } from '@/lib/auth-client'

import { LoadingScreen, useNotifications, useChatContext } from '@/components'
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout'
import {
  CardList,
  DeleteDialog,
  ErrorFallback,
  Filter,
  Header,
  Fab,
  ShareDialog,
  TutorSearchModal,
} from '@/components/info-hub'

import {
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
  const navigate = useNavigate()
  const chatContext = useChatContext()

  const [filterSubject, setFilterSubject] = createSignal<string>('All')
  const [isTutorSearchModalOpen, setIsTutorSearchModalOpen] =
    createSignal(false)

  let shareDialogRef: HTMLDialogElement | undefined
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

  function openShareDialog() {
    shareDialogRef?.showModal()
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

  function handleSelectTutor(tutor: { id: string; name: string }) {
    chatContext.setSelectedRecipient(tutor)
    setIsTutorSearchModalOpen(false)
    navigate({ to: '/messages' })
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

              <Fab
                onShare={openShareDialog}
                onSearchTutors={() => setIsTutorSearchModalOpen(true)}
              />

              <TutorSearchModal
                isOpen={isTutorSearchModalOpen()}
                onClose={() => setIsTutorSearchModalOpen(false)}
                onSelectTutor={handleSelectTutor}
              />

              <ShareDialog
                ref={(el) => {
                  shareDialogRef = el
                }}
                userId={session().data!.user.id}
              />
            </div>
          </Show>
        </ErrorBoundary>

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
