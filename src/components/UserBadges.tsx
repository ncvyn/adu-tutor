import { For, Show, createResource, createSignal, onCleanup } from 'solid-js'
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

  function toggleTip(badgeId: string) {
    setOpenTip((prev) => (prev === badgeId ? null : badgeId))
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-badge-tip]')) {
      setOpenTip(null)
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
    onCleanup(() => document.removeEventListener('click', handleClickOutside))
  }

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
                <div class="relative inline-block" data-badge-tip>
                  <button
                    type="button"
                    class="cursor-pointer rounded-full p-1 transition hover:bg-base-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTip(b.badgeId)
                    }}
                    aria-label={`Show info for ${b.name}`}
                  >
                    <img
                      src={`/badges/${b.svgFilename}`}
                      alt={b.name}
                      class="h-10 w-10"
                    />
                  </button>

                  <Show when={openTip() === b.badgeId}>
                    <div class="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg bg-neutral px-3 py-1.5 text-xs whitespace-nowrap text-neutral-content shadow-lg">
                      <span class="font-semibold">{b.name}</span>:{' '}
                      {b.description}
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral" />
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </Show>
  )
}
