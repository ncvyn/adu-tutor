import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { Search } from 'lucide-solid'
import { searchUsers } from '@/server/search-users.functions'
import { getInitials } from '@/lib/helper'

export type UserResult = {
  id: string
  name: string
}

export function SearchUsers(props: { onSelect?: (user: UserResult) => void }) {
  const [query, setQuery] = createSignal('')
  const [isOpen, setIsOpen] = createSignal(false)

  const trimmedQuery = createMemo(() => query().trim())

  const usersQuery = useQuery(() => ({
    queryKey: ['users', 'search', trimmedQuery()] as const,
    enabled: trimmedQuery().length > 0,
    queryFn: async () => searchUsers({ data: trimmedQuery() }),
    staleTime: 15_000,
  }))

  const results = createMemo(() => usersQuery.data ?? [])

  return (
    <div class="relative">
      <label class="input w-full">
        <Search class="h-4 w-4 opacity-50" />
        <input
          type="text"
          placeholder="Search users..."
          value={query()}
          onInput={(e) => {
            const value = e.currentTarget.value
            setQuery(value)
            setIsOpen(value.trim().length > 0)
          }}
          onFocus={() => {
            if (results().length > 0) setIsOpen(true)
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        <Show when={usersQuery.isFetching}>
          <span class="loading loading-xs loading-spinner" />
        </Show>
      </label>

      <Show when={isOpen() && results().length > 0}>
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
