import { For, Show, createResource, createSignal } from 'solid-js'
import { getMyBadges, getUserBadges } from '@/server/badge.functions'

export interface UserBadgesProps {
  userId?: string
}

export function UserBadges(props: UserBadgesProps) {
  const [badges] = createResource(
    () => props.userId,
    async (uid) => {
      if (uid) {
        return await getUserBadges({ data: { userId: uid } })
      }
      return await getMyBadges()
    },
  )

  const [openTip, setOpenTip] = createSignal<string | null>(null)

  return (
    <Show
      when={!badges.loading}
      fallback={<span class="loading loading-xs loading-spinner" />}
    >
      <Show when={badges() && badges()!.length > 0}>
        <div class="mt-4 w-full">
          <h3 class="mb-2 text-sm font-semibold tracking-wide uppercase opacity-60">
            Badges
          </h3>
          <div class="flex flex-wrap justify-center gap-2">
            <For each={badges()}>
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
  )
}
