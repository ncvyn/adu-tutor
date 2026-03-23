import { createSignal } from 'solid-js'
import { createMutation } from '@tanstack/solid-query'
import { submitReport } from '@/server/mod.functions'

export function ReportMessageModal(props: { messageId: string }) {
  const [reason, setReason] = createSignal('')
  const modalId = `report_modal_${props.messageId}`

  const mutation = createMutation(() => ({
    mutationFn: (input: { messageId: string; reason: string }) =>
      submitReport({ data: input }),
    onSuccess: () => {
      const modal = document.getElementById(modalId) as HTMLDialogElement
      modal.close()
      setReason('')
    },
  }))

  return (
    <>
      <button
        class="btn text-error btn-ghost btn-xs"
        onClick={() =>
          (document.getElementById(modalId) as HTMLDialogElement).showModal()
        }
      >
        Report
      </button>
      <dialog id={modalId} class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold text-error">Report Message</h3>
          <p class="py-4">
            Please provide a reason for reporting this message.
          </p>
          <textarea
            class="textarea-bordered textarea w-full textarea-error"
            placeholder="Reason..."
            value={reason()}
            onInput={(e) => setReason(e.currentTarget.value)}
          />
          <div class="modal-action">
            <form method="dialog">
              <button class="btn mr-2">Cancel</button>
            </form>
            <button
              class="btn btn-error"
              onClick={() =>
                mutation.mutate({
                  messageId: props.messageId,
                  reason: reason(),
                })
              }
              disabled={mutation.isPending}
            >
              Submit Report
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
