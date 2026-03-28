import { For, Show, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { searchTutees } from '@/server/search-users.functions'
import { assignBadge, getAllBadges } from '@/server/badge.functions'

type TuteeResult = {
  id: string
  name: string
}

export function AssignBadgeModal() {
  const [searchInput, setSearchInput] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [selectedTutee, setSelectedTutee] = createSignal<TuteeResult | null>(
    null,
  )
  const [selectedBadgeSlug, setSelectedBadgeSlug] = createSignal('')
  const [feedback, setFeedback] = createSignal<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isAssigning, setIsAssigning] = createSignal(false)

  const badgesQuery = useQuery(() => ({
    queryKey: ['badges'],
    queryFn: async () => getAllBadges(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  }))

  const tuteesQuery = useQuery(() => ({
    queryKey: ['search-tutees', searchQuery()],
    queryFn: async () => {
      const query = searchQuery().trim()
      if (!query) return []
      return searchTutees({ data: query }) as Promise<Array<TuteeResult>>
    },
    enabled: () => !!searchQuery().trim(),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  }))

  function handleSubmit(e: Event) {
    e.preventDefault()
    const trimmed = searchInput().trim()
    if (trimmed) setSearchQuery(trimmed)
  }

  async function handleAssign() {
    if (!selectedTutee() || !selectedBadgeSlug()) return

    setIsAssigning(true)
    setFeedback(null)

    try {
      const result = await assignBadge({
        data: {
          userId: selectedTutee()!.id,
          badgeSlug: selectedBadgeSlug(),
        },
      })

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.alreadyAssigned
            ? 'Badge is already assigned.'
            : 'Badge assigned successfully.',
        })
        return
      }

      setFeedback({
        type: 'error',
        message: result.error,
      })
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      setFeedback({
        type: 'error',
        message: `Failed to assign badge: ${err}`,
      })
    } finally {
      setIsAssigning(false)
    }
  }

  function handleClose() {
    setSearchInput('')
    setSearchQuery('')
    setSelectedTutee(null)
    setSelectedBadgeSlug('')
    setFeedback(null)

    const modal = document.getElementById('badge_modal') as HTMLDialogElement
    modal.close()
  }

  return (
    <dialog id="badge_modal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Assign Badge</h3>

        <form onSubmit={handleSubmit} class="mb-4" autocomplete="off">
          <input
            type="text"
            class="input-bordered input mt-4 w-full"
            placeholder="Search tutees..."
            value={searchInput()}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
            autofocus
          />
        </form>

        <Show when={searchQuery()}>
          <Show when={tuteesQuery.isFetching}>
            <div class="text-sm text-gray-500">Searching...</div>
          </Show>

          <Show when={!tuteesQuery.isFetching && tuteesQuery.data}>
            <Show
              when={tuteesQuery.data!.length > 0}
              fallback={<div>No tutees found.</div>}
            >
              <ul class="menu mt-2 rounded-box bg-base-200">
                <For each={tuteesQuery.data}>
                  {(tutee) => (
                    <li class="border-b border-base-300 last:border-b-0">
                      <button
                        type="button"
                        class="py-3 text-left"
                        onClick={() => setSelectedTutee(tutee)}
                      >
                        {tutee.name}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </Show>

        <Show when={selectedTutee()}>
          <p class="mt-3 text-sm">
            Selected tutee: <strong>{selectedTutee()!.name}</strong>
          </p>
        </Show>

        <Show when={badgesQuery.isFetching}>
          <div class="mt-4 text-sm text-gray-500">Loading badges...</div>
        </Show>

        <select
          class="select-bordered select mt-4 w-full"
          value={selectedBadgeSlug()}
          onChange={(e) => setSelectedBadgeSlug(e.currentTarget.value)}
          disabled={badgesQuery.isFetching}
        >
          <option value="">Select a badge</option>
          <For each={badgesQuery.data ?? []}>
            {(badge) => <option value={badge.slug}>{badge.name}</option>}
          </For>
        </select>

        <Show when={feedback()}>
          <div
            class={`mt-4 alert ${
              feedback()!.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <span>{feedback()!.message}</span>
          </div>
        </Show>

        <div class="modal-action">
          <button class="btn mr-2" type="button" onClick={handleClose}>
            Cancel
          </button>
          <button
            class="btn btn-primary"
            type="button"
            disabled={isAssigning() || !selectedTutee() || !selectedBadgeSlug()}
            onClick={() => void handleAssign()}
          >
            {isAssigning() ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  )
}
