import { For, Show, createResource } from 'solid-js'
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
                <div class="tooltip" data-tip={`${b.name}: ${b.description}`}>
                  <img
                    src={`/badges/${b.svgFilename}`}
                    alt={b.name}
                    class="h-10 w-10"
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </Show>
  )
}
