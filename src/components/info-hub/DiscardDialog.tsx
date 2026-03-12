interface InfoHubDiscardDialogProps {
  ref: (el: HTMLDialogElement) => void
  onKeepEditing: () => void
  onDiscard: () => void
}

export function InfoHubDiscardDialog(props: InfoHubDiscardDialogProps) {
  return (
    <dialog ref={props.ref} class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Discard draft?</h3>
        <p class="py-2 text-sm opacity-70">
          You have unsaved content. Do you want to discard it?
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" onClick={props.onKeepEditing}>
            Keep editing
          </button>
          <button class="btn btn-error" onClick={props.onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </dialog>
  )
}
