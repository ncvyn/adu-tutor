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

const tooltipClass = 'tooltip tooltip-neutral tooltip-left'

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
            class={`hidden md:inline-block ${tooltipClass}`}
            data-tip="Open quick actions"
          >
            <div
              tabindex={0}
              role="button"
              class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0"
              aria-label="Open quick actions"
            >
              <Ellipsis />
            </div>
          </div>

          <div class="fab-close">
            <div class={tooltipClass} data-tip="Close quick actions">
              <span class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0">
                <EllipsisVertical />
              </span>
            </div>
          </div>

          <div class={tooltipClass} data-tip="Share info">
            <button
              class="btn btn-circle btn-lg"
              type="button"
              onClick={props.onShare}
              aria-label="Share info"
            >
              <Share />
            </button>
          </div>

          <div class={tooltipClass} data-tip="Search tutors">
            <button
              class="btn btn-circle btn-lg"
              type="button"
              onClick={props.onSearchTutors}
              aria-label="Search tutors"
            >
              <Search />
            </button>
          </div>

          <div class={tooltipClass} data-tip="Apply for tutor">
            <button
              class="btn btn-circle btn-lg"
              type="button"
              onClick={openModal}
              aria-label="Apply for tutor"
            >
              <ClipboardPen />
            </button>
          </div>
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
