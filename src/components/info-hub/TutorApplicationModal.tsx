import { createSignal } from 'solid-js'
import { createMutation } from '@tanstack/solid-query'
import { submitTutorApplication } from '@/server/mod.functions'

export function TutorApplicationModal() {
  const [reason, setReason] = createSignal('')

  const mutation = createMutation(() => ({
    mutationFn: (r: string) => submitTutorApplication({ data: r }),
    onSuccess: () => {
      const modal = document.getElementById('tutor_modal') as HTMLDialogElement
      modal.close()
      setReason('')
    },
  }))

  return (
    <>
      <button
        class="btn btn-primary"
        onClick={() =>
          (
            document.getElementById('tutor_modal') as HTMLDialogElement
          ).showModal()
        }
      >
        Apply for Tutor Role
      </button>
      <dialog id="tutor_modal" class="modal">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Tutor Application</h3>
          <p class="py-4">Why do you want to become a tutor?</p>
          <textarea
            class="textarea-bordered textarea w-full"
            placeholder="Your reason..."
            value={reason()}
            onInput={(e) => setReason(e.currentTarget.value)}
          />
          <div class="modal-action">
            <form method="dialog">
              <button class="btn mr-2">Cancel</button>
            </form>
            <button
              class="btn btn-primary"
              onClick={() => mutation.mutate(reason())}
              disabled={mutation.isPending}
            >
              Submit
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
