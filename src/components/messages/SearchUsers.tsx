import { For, Show, createSignal, onCleanup } from 'solid-js'
import { Search } from 'lucide-solid'
import { searchUsers } from '@/server/search-users.functions'
import { getRecipients } from '@/server/recipients.functions'
import { getInitials } from '@/lib/helper'
import { useQuery } from '@tanstack/solid-query'

export type UserResult = {
  id: string
  name: string
  updatedAt?: number | Date
}

export function SearchUsers(props: { onSelect?: (user: UserResult) => void }) {
  const [query, setQuery] = createSignal('')
  const [results, setResults] = createSignal<Array<UserResult>>([])
  const [isLoading, setIsLoading] = createSignal(false)
  const [isOpen, setIsOpen] = createSignal(false)

  const recipientsQuery = useQuery(() => ({
    queryKey: ['recipients'],
    queryFn: async () => {
      try {
        const data = await getRecipients()
        return data
      } catch {
        return []
      }
    },
    staleTime: 1000 * 60 * 5,
  }))

  let rootRef: HTMLDivElement | undefined
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestToken = 0

  const closeDropdown = () => setIsOpen(false)

  const runSearch = (raw: string) => {
    const trimmed = raw.trim()

    if (!trimmed) {
      setResults([])
      setIsLoading(false)
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    const token = ++requestToken

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      try {
        const data = await searchUsers({ data: trimmed })
        if (token !== requestToken) return
        setResults(data)
      } catch {
        if (token !== requestToken) return
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 200)
  }

  const handleOutsidePointerDown = (event: PointerEvent) => {
    const root = rootRef
    if (!root) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (!root.contains(target)) closeDropdown()
  }

  onCleanup(() => {
    document.removeEventListener('pointerdown', handleOutsidePointerDown)
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  const formatTime = (ts?: number | Date) => {
    if (!ts) return ''

    const date = ts instanceof Date ? ts : new Date(ts)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div ref={rootRef} class="relative">
      <label class="input w-full">
        <Search class="h-4 w-4 opacity-50" />
        <input
          type="text"
          placeholder="Search users..."
          value={query()}
          onFocus={() => {
            if (query().trim()) setIsOpen(true)
          }}
          onInput={(e) => {
            const value = e.currentTarget.value
            setQuery(value)
            runSearch(value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeDropdown()
          }}
        />
        <Show when={isLoading()}>
          <span class="loading loading-xs loading-spinner" />
        </Show>
      </label>

      <Show when={isOpen() && query().trim().length > 0}>
        <ul class="menu absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
          <Show when={isLoading()}>
            <li>
              <div class="flex items-center gap-2 opacity-70">
                <span class="loading loading-xs loading-spinner" />
                Searching...
              </div>
            </li>
          </Show>

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
                    closeDropdown()
                  }}
                >
                  <div class="avatar avatar-placeholder">
                    <div class="w-8 rounded-full bg-neutral text-neutral-content">
                      <span class="text-xs font-semibold">
                        {getInitials(user.name)}
                      </span>
                    </div>
                  </div>
                  <span class="flex-1 text-left text-sm font-medium">
                    {user.name}
                  </span>
                </button>
              </li>
            )}
          </For>

          <Show when={!isLoading() && results().length === 0}>
            <li>
              <div class="text-sm opacity-60">No users found.</div>
            </li>
          </Show>
        </ul>
      </Show>

      <Show when={recipientsQuery.isLoading}>
        <div class="mb-2 flex items-center gap-2 opacity-70">
          <span class="loading loading-xs loading-spinner" />
          Loading recent chats...
        </div>
      </Show>

      <Show
        when={
          recipientsQuery.isSuccess && (recipientsQuery.data?.length ?? 0) > 0
        }
      >
        <div class="mt-4 mb-2">
          <div class="my-1 px-1 text-xs font-semibold opacity-60">
            Recent Chats
          </div>
          <ul class="menu w-full rounded-box bg-base-100 shadow">
            <For each={recipientsQuery.data}>
              {(user) => (
                <li>
                  <button
                    class="flex w-full items-center gap-3"
                    onClick={() => {
                      props.onSelect?.(user)
                      setQuery('')
                      setResults([])
                      closeDropdown()
                    }}
                  >
                    <div class="avatar avatar-placeholder">
                      <div class="w-8 rounded-full bg-neutral text-neutral-content">
                        <span class="text-xs font-semibold">
                          {getInitials(user.name)}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-1 items-center justify-between overflow-hidden md:flex-col md:items-start md:justify-center">
                      <span class="truncate text-sm font-medium">
                        {user.name}
                      </span>
                      <Show when={user.updatedAt}>
                        <span class="text-xs whitespace-nowrap opacity-50 md:mt-1">
                          {formatTime(user.updatedAt)}
                        </span>
                      </Show>
                    </div>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  )
}
