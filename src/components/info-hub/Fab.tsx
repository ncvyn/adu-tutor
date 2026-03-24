import {
  ClipboardPen,
  Ellipsis,
  EllipsisVertical,
  Search,
  Share,
} from 'lucide-solid'
import { createSignal } from 'solid-js'
import { createMutation } from '@tanstack/solid-query'
import { submitTutorApplication } from '@/server/mod.functions'
import { TutorApplicationModal } from './TutorApplicationModal'

interface FabProps {
  onShare: () => void
  onSearchTutors: () => void
}

export function Fab(props: FabProps) {
  const [reason, setReason] = createSignal('')

  const mutation = createMutation(() => ({
    mutationFn: (r: string) => submitTutorApplication({ data: r }),
    onSuccess: () => {
      const modal = document.getElementById('tutor_modal') as HTMLDialogElement
      modal.close()
      setReason('')
    },
  }))

  const openModal = () => {
    const modal = document.getElementById('tutor_modal') as HTMLDialogElement
    modal.showModal()
  }

  return (
    <>
      <div class="fixed right-8 bottom-8 z-50">
        <div class="fab">
          <div
            tabindex={0}
            role="button"
            class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0"
            aria-label="Open quick actions"
          >
            <Ellipsis />
          </div>

          <div class="fab-close">
            <span class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0">
              <EllipsisVertical />
            </span>
          </div>

          <button
            class="btn btn-circle btn-lg"
            type="button"
            onClick={props.onShare}
            aria-label="Share info"
            title="Share Info"
          >
            <Share />
          </button>

          <button
            class="btn btn-circle btn-lg"
            type="button"
            onClick={props.onSearchTutors}
            aria-label="Search tutors"
            title="Search Tutors"
          >
            <Search />
          </button>

          <button
            class="btn btn-circle btn-lg"
            type="button"
            onClick={openModal}
            aria-label="Apply for Tutor Role"
            title="Apply for Tutor Role"
          >
            <ClipboardPen />
          </button>
        </div>
      </div>

      <TutorApplicationModal
        reason={reason()}
        setReason={setReason}
        onSubmit={() => mutation.mutate(reason())}
        isPending={mutation.isPending}
      />
    </>
  )
}
