import { createEffect, createMemo, createSignal } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { useNotifications } from '@/components/Notifications'
import { getMyBadges } from '@/server/badge.functions'

export function BadgeWatcher() {
  const { notify } = useNotifications()
  const [hasInitialized, setHasInitialized] = createSignal(false)
  const [seenBadgeIds, setSeenBadgeIds] = createSignal<Array<string>>([])

  const badgeQuery = useQuery(() => ({
    queryKey: ['my-badges'],
    queryFn: getMyBadges,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  }))

  const badgeIds = createMemo(() => {
    const badges = badgeQuery.data
    return badges ? badges.map((badge) => badge.badgeId) : []
  })

  createEffect(() => {
    const badges = badgeQuery.data
    if (!badges || badgeQuery.isLoading || badgeQuery.isError) return

    const currentIds = badgeIds()

    if (!hasInitialized()) {
      setSeenBadgeIds(currentIds)
      setHasInitialized(true)
      return
    }

    const previousIds = new Set(seenBadgeIds())
    const added = badges.filter((badge) => !previousIds.has(badge.badgeId))

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
