import { For, Show, createEffect, createSignal, on } from 'solid-js'
import { Search } from 'lucide-solid'
import { searchUsers } from '@/lib/search-users'

export type UserResult = {
  id: string
  name: string
}

function debounce<T extends (...args: Array<any>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function SearchUsers(props: { onSelect?: (user: UserResult) => void }) {
  const [query, setQuery] = createSignal('')
  const [results, setResults] = createSignal<Array<UserResult>>([])
  const [isLoading, setIsLoading] = createSignal(false)
  const [isOpen, setIsOpen] = createSignal(false)

  const debounceMs = 250

  const fetchUsers = debounce(async (search: string) => {
    const trimmed = search.trim()
    if (!trimmed) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await searchUsers({ data: trimmed })
      setResults(data)
      setIsOpen(data.length > 0)
    } catch {
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, debounceMs)

  createEffect(
    on(query, (q) => {
      fetchUsers(q)
    }),
  )

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <div class="relative">
      <label class="input w-full">
        <Search class="h-4 w-4 opacity-50" />
        <input
          type="text"
          placeholder="Search users..."
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onFocus={() => results().length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        <Show when={isLoading()}>
          <span class="loading loading-xs loading-spinner" />
        </Show>
      </label>

      <Show when={isOpen()}>
        <ul class="menu absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
          <For each={results()}>
            {(user) => (
              <li>
                <button
                  class="flex items-center gap-3"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    props.onSelect?.(user)
                    setQuery('')
                    setResults([])
                    setIsOpen(false)
                  }}
                >
                  <div class="avatar avatar-placeholder">
                    <div class="w-8 rounded-full bg-neutral text-neutral-content">
                      <span class="text-xs font-semibold">
                        {getInitials(user.name)}
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-start">
                    <span class="text-sm font-medium">{user.name}</span>
                  </div>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
