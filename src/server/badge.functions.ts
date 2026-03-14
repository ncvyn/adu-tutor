import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { badge, userBadge } from '@/schemas/badge'
import { middleware } from '@/lib/middleware'
import { awardBadge } from '@/server/badge.server'

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

export const assignBadge = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string; badgeSlug: string }) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return await awardBadge(data.userId, data.badgeSlug)
  })

export const revokeBadge = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string; badgeSlug: string }) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    if (session.user.role !== 'tutor') {
      throw new Error('Forbidden: only tutors can revoke badges')
    }

    const badges = await db
      .select()
      .from(badge)
      .where(eq(badge.slug, data.badgeSlug))
      .limit(1)

    if (badges.length === 0) {
      throw new Error(`Badge not found: ${data.badgeSlug}`)
    }

    const [targetBadge] = badges
    await db
      .delete(userBadge)
      .where(
        and(
          eq(userBadge.userId, data.userId),
          eq(userBadge.badgeId, targetBadge.id),
        ),
      )

    return { success: true }
  })
