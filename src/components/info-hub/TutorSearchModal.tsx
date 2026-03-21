import { For, Show, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { DAYS } from '@/lib/constants'
import { searchTutors } from '@/server/search-users.functions'

type TutorSearchResult = {
  id: string
  name: string
  preferredSubjects: Array<string>
  availability: Record<string, string>
}

interface TutorSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTutor: (tutor: { id: string; name: string }) => void
}

function getAvailabilityEntries(availability: Record<string, string>) {
  return DAYS.flatMap((day) => {
    const value = availability[day]
    return value ? [[day, value] as const] : []
  })
}

export function TutorSearchModal(props: TutorSearchModalProps) {
  const [searchInput, setSearchInput] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')

  const tutorsQuery = useQuery(() => ({
    queryKey: ['search-tutors', searchQuery()],
    queryFn: async () => {
      if (!searchQuery().trim()) return []
      return searchTutors({ data: searchQuery() }) as Promise<
        Array<TutorSearchResult>
      >
    },
    enabled: () => !!searchQuery().trim() && props.isOpen,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  }))

  function handleInput(e: Event) {
    setSearchInput((e.target as HTMLInputElement).value)
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    const trimmed = searchInput().trim()
    if (trimmed) {
      setSearchQuery(trimmed)
    }
  }

  function handleClose() {
    setSearchInput('')
    setSearchQuery('')
    props.onClose()
  }

  return (
    <Show when={props.isOpen}>
      <div class="modal-open modal">
        <div class="modal-box">
          <button
            class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>

          <h3 class="mb-4 text-lg font-bold">Search for Tutors</h3>

          <form
            onSubmit={handleSubmit}
            class="mb-4 flex items-center gap-2"
            autocomplete="off"
          >
            <input
              type="text"
              class="input-bordered input w-full"
              placeholder="Type tutor name..."
              value={searchInput()}
              onInput={handleInput}
              autofocus
            />
            <button
              type="submit"
              class="btn btn-primary"
              disabled={!searchInput().trim()}
            >
              Search
            </button>
          </form>

          <Show when={searchQuery()}>
            <Show when={tutorsQuery.isFetching}>
              <div class="text-sm text-gray-500">Searching...</div>
            </Show>

            <Show when={!tutorsQuery.isFetching && tutorsQuery.data}>
              <Show
                when={tutorsQuery.data!.length > 0}
                fallback={<div>No tutors found.</div>}
              >
                <ul class="menu mt-2 rounded-box bg-base-200">
                  <For each={tutorsQuery.data}>
                    {(tutor) => (
                      <li class="border-b border-base-300 last:border-b-0">
                        <button
                          type="button"
                          class="flex flex-col items-start gap-2 py-3"
                          onClick={() => {
                            setSearchInput('')
                            setSearchQuery('')
                            props.onSelectTutor(tutor)
                          }}
                        >
                          <div class="font-medium">{tutor.name}</div>

                          <Show
                            when={tutor.preferredSubjects.length > 0}
                            fallback={
                              <span class="text-xs opacity-60">
                                No preferred subjects set
                              </span>
                            }
                          >
                            <div class="flex flex-wrap gap-1">
                              <For each={tutor.preferredSubjects}>
                                {(subject) => (
                                  <span class="badge badge-soft badge-sm">
                                    {subject}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>

                          <Show
                            when={
                              getAvailabilityEntries(tutor.availability)
                                .length > 0
                            }
                            fallback={
                              <span class="text-xs opacity-60">
                                No schedule set
                              </span>
                            }
                          >
                            <div class="text-left text-xs opacity-70">
                              <div class="mb-1 font-semibold">
                                Preferred schedule
                              </div>
                              <ul class="list-disc space-y-1 pl-4">
                                <For
                                  each={getAvailabilityEntries(
                                    tutor.availability,
                                  )}
                                >
                                  {([day, schedule]) => (
                                    <li>
                                      {day}: {schedule}
                                    </li>
                                  )}
                                </For>
                              </ul>
                            </div>
                          </Show>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </Show>
          </Show>
        </div>
        <div class="modal-backdrop" onClick={handleClose}></div>
      </div>
    </Show>
  )
}
