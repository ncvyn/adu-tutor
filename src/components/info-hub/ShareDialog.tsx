import { For, Show, createMemo, createSignal } from 'solid-js'
import { useMutation, useQueryClient } from '@tanstack/solid-query'

import { SUBJECTS } from '@/lib/constants'

import { createInfoCard } from '@/server/info-cards.functions'

import { useNotifications } from '@/components/Notifications'
import { MarkdownEditor } from '@/components/MarkdownEditor'

import { DiscardDialog } from './DiscardDialog'

interface ShareDialogProps {
  ref: (el: HTMLDialogElement) => void
  userId: string
}

export function ShareDialog(props: ShareDialogProps) {
  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  const [newTitle, setNewTitle] = createSignal('')
  const [newContent, setNewContent] = createSignal('')
  const [newSubjects, setNewSubjects] = createSignal<Array<string>>(['General'])
  const [allowClose, setAllowClose] = createSignal(false)

  let shareDialogRef: HTMLDialogElement | undefined
  let confirmDialogRef: HTMLDialogElement | undefined

  const createCardMutation = useMutation(() => ({
    mutationKey: ['info-card', 'create', props.userId] as const,
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

  function bindRef(el: HTMLDialogElement) {
    shareDialogRef = el
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

      <DiscardDialog
        ref={(el) => {
          confirmDialogRef = el
        }}
        onKeepEditing={cancelDiscard}
        onDiscard={confirmDiscard}
      />
    </>
  )
}
