import { For, Show, Suspense } from 'solid-js'
import { APP_VERSION } from '@/lib/version'
import { useQuery } from '@tanstack/solid-query'
import { getCohortMembers } from '@/server/cohort.functions'
import type { CohortMember } from '@/schemas/cohort'

export function AboutUsModal(props: { open: boolean; onClose: () => void }) {
  const cohortQuery = useQuery(() => ({
    queryKey: ['cohort-members'],
    queryFn: async () => getCohortMembers(),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    staleTime: Infinity,
  }))

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none">
        <div class="w-full max-w-2xl rounded-box bg-base-100 p-4 shadow-xl">
          <div class="flex flex-col items-center">
            <img src="/adu-tutor-logo.svg" alt="AdU-Tutor Logo" class="w-85" />
            <p class="-mt-2 opacity-60">v{APP_VERSION}</p>
            <p class="font-bold">12STECH01 Cohort 3</p>
            <p class="mb-4 font-bold">S.Y. 2025-2026</p>
            <Suspense fallback={<div class="loading-dots"></div>}>
              <Show
                when={cohortQuery.data}
                fallback={<div>Failed to fetch data.</div>}
              >
                <div class="grid w-full grid-cols-2 gap-2">
                  <For each={cohortQuery.data ?? []}>
                    {(member: CohortMember) => (
                      <div class="flex flex-col items-center">
                        <p class="text-center">{member.name}</p>
                        <p class="text-center opacity-60">{member.role}</p>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Suspense>
          </div>
          <div class="mt-4 flex justify-end">
            <button class="btn btn-primary" onClick={props.onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
