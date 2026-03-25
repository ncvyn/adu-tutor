import {
  ClipboardPen,
  Ellipsis,
  EllipsisVertical,
  Search,
  Share,
  Shield,
} from 'lucide-solid'
import { createSignal, Show } from 'solid-js'
import { createMutation } from '@tanstack/solid-query'

import { fetchData, submitTutorApplication } from '@/server/mod.functions'
import { type User } from '@/schemas/auth'
import { type Report, type TutorApplication } from '@/schemas/mod'

import { TutorApplicationModal } from './TutorApplicationModal'
import { ModPanel } from './ModPanel'

const tooltipClass = 'tooltip tooltip-neutral tooltip-left'

interface FabProps {
  onShare: () => void
  onSearchTutors: () => void
  user: User
}

export function Fab(props: FabProps) {
  const [reason, setReason] = createSignal('')
  const [modData, setModData] = createSignal<{
    tutorApplications: TutorApplication[]
    reports: Report[]
  } | null>(null)
  const [loadingModData, setLoadingModData] = createSignal(false)

  const mutation = createMutation(() => ({
    mutationFn: (r: string) => submitTutorApplication({ data: r }),
    onSuccess: () => {
      const modal = document.getElementById('tutor_modal') as HTMLDialogElement
      modal.close()
      setReason('')
    },
  }))

  const openTutorModal = () => {
    const modal = document.getElementById('tutor_modal') as HTMLDialogElement
    modal.showModal()
  }

  const openModPanel = async () => {
    const modal = document.getElementById('mod_panel') as HTMLDialogElement
    setLoadingModData(true)

    try {
      const data = await fetchData()
      setModData(data)
      modal.showModal()
    } finally {
      setLoadingModData(false)
    }
  }

  return (
    <>
      <div class="fixed right-8 bottom-8 z-50">
        <div
          class={`mr-8 mb-16 md:mb-0 ${tooltipClass}`}
          data-tip="Quick actions"
        >
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

            <Show when={props.user.role === 'tutee'}>
              <div class={tooltipClass} data-tip="Apply for tutor">
                <button
                  class="btn btn-circle btn-lg"
                  type="button"
                  onClick={openTutorModal}
                  aria-label="Apply for tutor"
                >
                  <ClipboardPen />
                </button>
              </div>
            </Show>

            <Show when={props.user.role === 'mod'}>
              <div class={tooltipClass} data-tip="Open mod panel">
                <button
                  class="btn btn-circle btn-lg"
                  type="button"
                  onClick={openModPanel}
                  aria-label="Open mod panel"
                >
                  <Shield />
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>

      <TutorApplicationModal
        reason={reason()}
        setReason={setReason}
        onSubmit={() => mutation.mutate(reason())}
        isPending={mutation.isPending}
      />

      <ModPanel data={modData()} isLoading={loadingModData()} />
    </>
  )
}
