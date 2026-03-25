import { For, Show, createEffect, createMemo, createSignal, on } from 'solid-js'
import { useMutation, useQueryClient } from '@tanstack/solid-query'

import { SUBJECTS } from '@/lib/constants'
import { updateInfoCard } from '@/server/info-cards.functions'
import type { InfoCardWithVotes } from '@/schemas/info'

import { MarkdownEditor } from '@/components/MarkdownEditor'
import { useNotifications } from '@/components/Notifications'

interface EditDialogProps {
  ref: (el: HTMLDialogElement) => void
  card: () => InfoCardWithVotes | null
  openCount?: () => number
}

export function EditDialog(props: EditDialogProps) {
  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [newSubjects, setNewSubjects] = createSignal<Array<string>>(['General'])
  const [allowClose, setAllowClose] = createSignal(false)

  let editDialogRef: HTMLDialogElement | null
  let confirmDialogRef: HTMLDialogElement | null

  function syncFromCard(card: InfoCardWithVotes) {
    setNewTitle(card.title)
    setNewContent(card.content)
    setNewSubjects(card.subjects.length > 0 ? [...card.subjects] : ['General'])
  }

  createEffect(
    on(
      () => props.openCount?.() ?? 0,
      () => {
        const card = props.card()
        if (card) {
          syncFromCard(card)
        }
      },
    ),
  )

  const updateCardMutation = useMutation(() => ({
    mutationKey: ['info-card', 'update', props.card()?.id] as const,
    mutationFn: async (payload: {
      id: string
      title: string
      content: string
      subjects: Array<string>
    }) => updateInfoCard({ data: payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['info-cards'] })
      closeEditDialog()
    },
    onError: (err) => {
      notify({
        type: 'error',
        message: `Error updating info card: ${String(err)}`,
      })
    },
  }))

  const isFormValid = createMemo(
    () => newTitle().trim().length > 0 && newContent().trim().length > 0,
  )

  const isDirty = createMemo(() => {
    const card = props.card()
    if (!card) return false
    return (
      newTitle().trim() !== card.title.trim() ||
      newContent().trim() !== card.content.trim() ||
      JSON.stringify([...newSubjects()].sort()) !==
        JSON.stringify([...card.subjects].sort())
    )
  })

  function resetForm() {
    setNewTitle('')
    setNewContent('')
    setNewSubjects(['General'])
  }

  function closeEditDialog() {
    setAllowClose(true)
    editDialogRef?.close()
    resetForm()
  }

  function requestCloseDialog() {
    if (!isDirty()) {
      closeEditDialog()
      return
    }
    confirmDialogRef?.showModal()
  }

  function confirmDiscard() {
    confirmDialogRef?.close()
    closeEditDialog()
  }

  function cancelDiscard() {
    confirmDialogRef?.close()
  }

  async function saveCard() {
    const card = props.card()
    if (!card || !isFormValid() || updateCardMutation.isPending) return

    await updateCardMutation.mutateAsync({
      id: card.id,
      title: newTitle().trim(),
      content: newContent().trim(),
      subjects: newSubjects(),
    })
  }

  function bindRef(el: HTMLDialogElement) {
    editDialogRef = el
    props.ref(el)
  }

  return (
    <>
      <dialog
        ref={bindRef}
        class="modal"
        onClose={() => {
          if (!allowClose()) setAllowClose(true)
        }}
      >
        <div class="modal-box">
          <h3 class="text-lg font-bold">Edit info card</h3>

          <div class="mt-4 space-y-3">
            <fieldset class="fieldset w-full">
              <legend class="fieldset-legend">Title</legend>
              <input
                class="input-bordered input w-full"
                value={newTitle()}
                onInput={(e) => setNewTitle(e.currentTarget.value)}
                placeholder="Card title"
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
              <MarkdownEditor
                value={newContent()}
                onChange={setNewContent}
                placeholder={
                  'Use **bold**, *italics*, lists, and [links](https://...)'
                }
                options={{
                  spellChecker: false,
                }}
              />
            </fieldset>
          </div>

          <div class="modal-action">
            <button class="btn btn-ghost" onClick={requestCloseDialog}>
              Cancel
            </button>
            <button
              class="btn btn-primary"
              disabled={!isFormValid() || updateCardMutation.isPending}
              onClick={saveCard}
            >
              <Show
                when={!updateCardMutation.isPending}
                fallback={<span class="loading loading-sm loading-spinner" />}
              >
                Save
              </Show>
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={(el) => (confirmDialogRef = el)} class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Discard changes?</h3>
          <p class="py-2 text-sm opacity-70">
            You have unsaved edits. Do you want to discard them?
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost" onClick={cancelDiscard}>
              Cancel
            </button>
            <button class="btn btn-error" onClick={confirmDiscard}>
              Discard
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
