import { For, Show, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { searchTutors } from '@/server/search-users.functions'

interface TutorSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTutor: (tutor: { id: string; name: string }) => void
}

export function TutorSearchModal(props: TutorSearchModalProps) {
  const [searchInput, setSearchInput] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')

  const tutorsQuery = useQuery(() => ({
    queryKey: ['search-tutors', searchQuery()],
    queryFn: async () => {
      if (!searchQuery().trim()) return []
      return searchTutors({ data: searchQuery() })
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
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput('')
                            setSearchQuery('')
                            props.onSelectTutor(tutor)
                          }}
                        >
                          {tutor.name}
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
