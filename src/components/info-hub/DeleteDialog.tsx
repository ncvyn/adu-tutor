import { Show } from 'solid-js'

interface DeleteDialogProps {
  ref: (el: HTMLDialogElement) => void
  title: string | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteDialog(props: DeleteDialogProps) {
  return (
    <dialog ref={props.ref} class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Delete info card?</h3>
        <p class="py-2 text-sm opacity-70">
          Are you sure you want to delete "<b>{props.title}</b>"? This action
          cannot be undone.
        </p>
        <div class="modal-action">
          <button
            class="btn btn-ghost"
            onClick={props.onCancel}
            disabled={props.isDeleting}
          >
            Cancel
          </button>
          <button
            class="btn btn-error"
            onClick={props.onConfirm}
            disabled={props.isDeleting}
          >
            <Show
              when={!props.isDeleting}
              fallback={<span class="loading loading-sm loading-spinner" />}
            >
              Delete
            </Show>
          </button>
        </div>
      </div>
    </dialog>
  )
}
