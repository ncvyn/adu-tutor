import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { badge, userBadge } from '@/schemas/badge'
import { middleware } from '@/lib/middleware'

export const getAllBadges = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.select().from(badge)
  },
)

export const getUserBadges = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId: string }) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: userBadge.id,
        userId: userBadge.userId,
        badgeId: userBadge.badgeId,
        awardedAt: userBadge.awardedAt,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        svgFilename: badge.svgFilename,
      })
      .from(userBadge)
      .innerJoin(badge, eq(userBadge.badgeId, badge.id))
      .where(eq(userBadge.userId, data.userId))

    return rows
  })

export const getMyBadges = createServerFn({ method: 'GET' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const rows = await db
      .select({
        id: userBadge.id,
        badgeId: userBadge.badgeId,
        awardedAt: userBadge.awardedAt,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        svgFilename: badge.svgFilename,
      })
      .from(userBadge)
      .innerJoin(badge, eq(userBadge.badgeId, badge.id))
      .where(eq(userBadge.userId, session.user.id))

    return rows
  })
