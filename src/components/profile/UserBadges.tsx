import { For, Show, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { getMyBadges, getUserBadges } from '@/server/badge.functions'

export interface UserBadgesProps {
  userId?: string
}

export function UserBadges(props: UserBadgesProps) {
  const [openTip, setOpenTip] = createSignal<string | null>(null)

  const badgesQuery = useQuery(() => ({
    queryKey: ['user-badges', props.userId ?? 'me'] as const,
    queryFn: async () => {
      if (props.userId) {
        return await getUserBadges({ data: { userId: props.userId } })
      }
      return await getMyBadges()
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  }))

  return (
    <Show
      when={!badgesQuery.isPending}
      fallback={<span class="loading loading-xs loading-spinner" />}
    >
      <Show
        when={!badgesQuery.isError}
        fallback={
          <span class="text-xs opacity-70">Failed to load badges.</span>
        }
      >
        <Show when={(badgesQuery.data?.length ?? 0) > 0}>
          <div class="mt-4 w-full">
            <h3 class="mb-2 text-sm font-semibold tracking-wide uppercase opacity-60">
              Badges
            </h3>
            <div class="flex flex-wrap justify-center gap-2">
              <For each={badgesQuery.data ?? []}>
                {(b) => (
                  <div
                    class="tooltip"
                    classList={{ 'tooltip-open': openTip() === b.badgeId }}
                    data-tip={`${b.name}: ${b.description}`}
                  >
                    <button
                      type="button"
                      class="cursor-pointer rounded-full p-1 transition hover:bg-base-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenTip((prev) =>
                          prev === b.badgeId ? null : b.badgeId,
                        )
                      }}
                      aria-label={`Show info for ${b.name}`}
                    >
                      <img
                        src={`/badges/${b.svgFilename}`}
                        alt={b.name}
                        class="h-10 w-10"
                      />
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </Show>
  )
}
