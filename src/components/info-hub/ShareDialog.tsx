import { For, Show } from 'solid-js'
import { SUBJECTS } from '@/lib/constants'

interface ShareDialogProps {
  ref: (el: HTMLDialogElement) => void
  allowClose: boolean
  onRequestClose: () => void
  onAfterClose: () => void
  title: string
  content: string
  subjects: Array<string>
  isFormValid: boolean
  isPosting: boolean
  onTitleInput: (value: string) => void
  onContentInput: (value: string) => void
  onToggleSubject: (subject: string) => void
  onSubmit: () => void
}

export function ShareDialog(props: ShareDialogProps) {
  return (
    <dialog
      ref={props.ref}
      class="modal"
      onClose={() => {
        if (!props.allowClose) props.onRequestClose()
        props.onAfterClose()
      }}
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">Share...</h3>

        <div class="mt-4 space-y-3">
          <fieldset class="fieldset w-full">
            <legend class="fieldset-legend">Title</legend>
            <input
              class="input-bordered input w-full"
              value={props.title}
              onInput={(e) => props.onTitleInput(e.currentTarget.value)}
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
                      checked={props.subjects.includes(subject)}
                      onInput={() => props.onToggleSubject(subject)}
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
              value={props.content}
              onInput={(e) => props.onContentInput(e.currentTarget.value)}
              placeholder={
                'Use **bold**, *italics*, lists, and [links](https://...)'
              }
            />
          </fieldset>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" onClick={props.onRequestClose}>
            Cancel
          </button>
          <button
            class="btn btn-primary"
            disabled={!props.isFormValid || props.isPosting}
            onClick={props.onSubmit}
          >
            <Show
              when={!props.isPosting}
              fallback={<span class="loading loading-sm loading-spinner" />}
            >
              Post
            </Show>
          </button>
        </div>
      </div>
    </dialog>
  )
}
