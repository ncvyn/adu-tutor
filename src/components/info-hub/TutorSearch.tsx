import { Show, createSignal, For } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { searchTutors } from '@/server/search-users.functions'

export function TutorSearch() {
  const [query, setQuery] = createSignal('')
  const [input, setInput] = createSignal('')
  const [isOpen, setIsOpen] = createSignal(false)

  const tutorsQuery = useQuery(() => ({
    queryKey: ['search-tutors', query()],
    queryFn: async () => {
      if (!query().trim()) return []
      return searchTutors({ data: query() })
    },
    enabled: () => !!query().trim(),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  }))

  function handleInput(e: Event) {
    setInput((e.target as HTMLInputElement).value)
  }

  function handleSearch(e: Event) {
    e.preventDefault()
    const trimmed = input().trim()
    if (trimmed) {
      setQuery(trimmed)
      setIsOpen(true)
    }
  }

  return (
    <div class="mb-8">
      <form onSubmit={handleSearch} class="flex items-center gap-2">
        <input
          type="text"
          class="input-bordered input w-full max-w-xs"
          placeholder="Search for tutors by name"
          value={input()}
          onInput={handleInput}
        />
        <button
          type="submit"
          class="btn btn-primary"
          disabled={!input().trim()}
        >
          Search
        </button>
      </form>

      <Show when={isOpen() && query()}>
        <div class="mt-2">
          <Show when={tutorsQuery.isFetching}>
            <div class="text-sm text-gray-500">Searching...</div>
          </Show>

          <Show when={!tutorsQuery.isFetching && tutorsQuery.data}>
            <Show
              when={tutorsQuery.data!.length > 0}
              fallback={<div>No tutors found.</div>}
            >
              <ul class="menu rounded-box bg-base-200">
                <For each={tutorsQuery.data}>
                  {(tutor) => (
                    <li>
                      <span>{tutor.name}</span>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  )
}
