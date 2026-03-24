interface TutorApplicationModalProps {
  reason: string
  setReason: (reason: string) => void
  onSubmit: () => void
  isPending: boolean
}

export function TutorApplicationModal(props: TutorApplicationModalProps) {
  return (
    <dialog id="tutor_modal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Tutor Application</h3>
        <p class="py-4">Why do you want to become a tutor?</p>
        <textarea
          class="textarea-bordered textarea w-full"
          placeholder="Your reason..."
          value={props.reason}
          onInput={(e) => props.setReason(e.currentTarget.value)}
        />
        <div class="modal-action">
          <form method="dialog">
            <button class="btn mr-2" type="submit">
              Cancel
            </button>
          </form>
          <button
            class="btn btn-primary"
            type="button"
            onClick={props.onSubmit}
            disabled={!!props.isPending}
          >
            {props.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
