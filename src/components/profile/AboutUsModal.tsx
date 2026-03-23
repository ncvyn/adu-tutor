import { Show } from 'solid-js'
import { APP_VERSION } from '@/lib/version'

export function AboutUsModal(props: { open: boolean; onClose: () => void }) {
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-box bg-base-100 p-4 shadow-xl">
          <div class="flex flex-col items-center">
            <img src="/adu-tutor-logo.svg" alt="AdU-Tutor Logo" class="w-85" />
            <p class="mb-4 opacity-60">v{APP_VERSION}</p>
            <div class="grid w-full grid-cols-2 gap-2">
              <div class="flex flex-col items-center">
                <p class="text-center">Lorem Ipsum</p>
                <p class="text-center opacity-60">Role 1</p>
              </div>
              <div class="flex flex-col items-center">
                <p class="text-center">Dolor Sit</p>
                <p class="text-center opacity-60">Role 2</p>
              </div>
              <div class="flex flex-col items-center">
                <p class="text-center">Amet Consectetur</p>
                <p class="text-center opacity-60">Role 3</p>
              </div>
              <div class="flex flex-col items-center">
                <p class="text-center">Adipiscing Elit</p>
                <p class="text-center opacity-60">Role 4</p>
              </div>
            </div>
          </div>
          <button class="btn mt-4 btn-primary" onClick={props.onClose}>
            Close
          </button>
        </div>
      </div>
    </Show>
  )
}
