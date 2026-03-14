import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { badge, userBadge } from '@/schemas/badge'

export const awardBadge = async (userId: string, badgeSlug: string) => {
  const badges = await db
    .select()
    .from(badge)
    .where(eq(badge.slug, badgeSlug))
    .limit(1)

  if (badges.length === 0) {
    throw new Error(`Badge not found: ${badgeSlug}`)
  }

  const [targetBadge] = badges
  const rows = await db
    .select()
    .from(userBadge)
    .where(
      and(eq(userBadge.userId, userId), eq(userBadge.badgeId, targetBadge.id)),
    )
    .limit(1)

  if (rows.length > 0) {
    return { alreadyAssigned: true, userBadge: rows[0] }
  }

  const [newUserBadge] = await db
    .insert(userBadge)
    .values({
      id: crypto.randomUUID(),
      userId: userId,
      badgeId: targetBadge.id,
    })
    .returning()

  return { alreadyAssigned: false, userBadge: newUserBadge }
}
