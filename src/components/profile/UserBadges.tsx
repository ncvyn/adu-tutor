import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import {
  getAllBadges,
  getMyBadges,
  getUserBadges,
} from '@/server/badge.functions'

interface UserBadgesProps {
  userId?: string
}

export function UserBadges(props: UserBadgesProps) {
  const [openTip, setOpenTip] = createSignal<string | null>(null)

  const allBadgesQuery = useQuery(() => ({
    queryKey: ['all-badges'],
    queryFn: getAllBadges,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  }))

  const userBadgesQuery = useQuery(() => ({
    queryKey: ['user-badges', props.userId ?? 'me'] as const,
    queryFn: async () => {
      if (props.userId) {
        return await getUserBadges({ data: { userId: props.userId } })
      }
      return await getMyBadges()
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  }))

  const obtainedIds = createMemo(
    () => new Set((userBadgesQuery.data ?? []).map((b) => b.badgeId)),
  )

  return (
    <Show
      when={!allBadgesQuery.isPending && !userBadgesQuery.isPending}
      fallback={<span class="loading loading-xs loading-spinner" />}
    >
      <Show
        when={!allBadgesQuery.isError && !userBadgesQuery.isError}
        fallback={
          <span class="text-xs opacity-70">Failed to load badges.</span>
        }
      >
        <Show when={(allBadgesQuery.data?.length ?? 0) > 0}>
          <div class="mt-4 w-full">
            <h3 class="mb-2 text-sm font-semibold tracking-wide uppercase opacity-60">
              Badges
            </h3>
            <div class="flex flex-wrap justify-center gap-2">
              <For each={allBadgesQuery.data ?? []}>
                {(b) => {
                  const obtained = obtainedIds().has(b.id)
                  return (
                    <div
                      class="tooltip"
                      classList={{ 'tooltip-open': openTip() === b.id }}
                    >
                      <div class="tooltip-content">
                        <div class="font-bold">{b.name}</div>
                        <div class="text-primary-content">{b.description}</div>
                      </div>
                      <button
                        type="button"
                        class="cursor-pointer rounded-full p-1 transition hover:bg-base-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTip((prev) => (prev === b.id ? null : b.id))
                        }}
                        aria-label={`Show info for ${b.name}`}
                      >
                        <img
                          src={`/badges/${b.svgFilename}`}
                          alt={b.name}
                          class={`h-10 w-10 ${obtained ? '' : 'brightness-50 grayscale-100'}`}
                        />
                      </button>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </Show>
  )
}
