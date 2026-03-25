import { Show } from 'solid-js'
import { type TutorApplication, type Report } from '@/schemas/mod'

interface ModPanelProps {
  data: { tutorApplications: TutorApplication[]; reports: Report[] } | null
  isLoading: boolean
}

export function ModPanel(props: ModPanelProps) {
  return (
    <dialog id="mod_panel" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Moderation Data</h3>

        <Show
          when={props.isLoading}
          fallback={
            <div class="space-y-4 py-4">
              <div>
                <h4 class="font-semibold">Tutor Applications</h4>
                <pre class="text-sm whitespace-pre-wrap">
                  {JSON.stringify(props.data?.tutorApplications ?? [], null, 2)}
                </pre>
              </div>

              <div>
                <h4 class="font-semibold">Reports</h4>
                <pre class="text-sm whitespace-pre-wrap">
                  {JSON.stringify(props.data?.reports ?? [], null, 2)}
                </pre>
              </div>
            </div>
          }
        >
          <p class="py-4">Loading moderation data...</p>
        </Show>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn" type="submit">
              Close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
