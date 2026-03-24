import { createEffect, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { useNotifications } from '@/components/Notifications'
import { getMyBadges } from '@/server/badge.functions'

export function BadgeWatcher() {
  const { notify } = useNotifications()
  const [seenBadgeIds, setSeenBadgeIds] = createSignal<Set<string> | null>(null)

  const badgeQuery = useQuery(() => ({
    queryKey: ['my-badges'],
    queryFn: getMyBadges,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 30_000,
  }))

  createEffect(() => {
    const badges = badgeQuery.data
    if (!badges) return

    const currentIds = new Set(badges.map((b) => b.badgeId))

    if (!seenBadgeIds()) {
      setSeenBadgeIds(currentIds)
      return
    }

    const previousIds = seenBadgeIds()!
    const added = badges.filter((b) => !previousIds.has(b.badgeId))

    for (const badge of added) {
      notify({
        type: 'success',
        message: `Congratulations! You've earned the ${badge.name} badge.`,
      })
    }

    setSeenBadgeIds(currentIds)
  })

  return null
}
