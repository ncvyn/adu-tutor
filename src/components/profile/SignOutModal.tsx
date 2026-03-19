import { Show } from 'solid-js'

interface SignOutModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isSigningOut: boolean
}

export function SignOutModal(props: SignOutModalProps) {
  return (
    <dialog class={`modal ${props.open ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="text-lg font-bold">Sign out?</h3>
        <p class="mt-2 text-sm opacity-80">
          You’ll be signed out of your current session.
        </p>
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            onClick={props.onCancel}
            disabled={props.isSigningOut}
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error"
            onClick={props.onConfirm}
            disabled={props.isSigningOut}
          >
            <Show
              when={!props.isSigningOut}
              fallback={<span class="loading loading-xs loading-spinner" />}
            >
              Sign out
            </Show>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" onClick={props.onCancel}>
          close
        </button>
      </form>
    </dialog>
  )
}
