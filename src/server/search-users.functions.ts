import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, desc, eq, like, ne, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/schemas/auth'
import { conversation } from '@/schemas/chat'
import { auth } from '@/lib/auth'

export const searchUsers = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const trimmed = query.trim()
    if (!trimmed) return []

    const results = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .innerJoin(
        conversation,
        or(
          and(
            eq(conversation.minUserId, session.user.id),
            eq(conversation.maxUserId, user.id),
          ),
          and(
            eq(conversation.maxUserId, session.user.id),
            eq(conversation.minUserId, user.id),
          ),
        ),
      )
      .where(
        and(
          like(user.name, `%${trimmed}%`),
          ne(user.id, session.user.id),
          eq(user.banned, false),
        ),
      )
      .orderBy(desc(conversation.updatedAt))
      .limit(10)

    return results
  })

export const searchTutors = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session || session.user.role !== 'tutee') {
      throw new Error('Unauthorized')
    }

    const trimmed = query.trim()
    if (!trimmed) return []

    const results = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(
        and(
          like(user.name, `%${trimmed}%`),
          ne(user.id, session.user.id),
          eq(user.role, 'tutor'),
          eq(user.banned, false),
        ),
      )
      .limit(10)

    return results
  })
