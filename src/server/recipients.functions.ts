import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, desc, eq, ne, or } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation } from '@/schemas/chat'
import { user } from '@/schemas/auth'

export const getRecipients = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) return []

    const id = session.user.id

    const profiles = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .innerJoin(
        conversation,
        or(
          and(
            eq(conversation.minUserId, id),
            eq(conversation.maxUserId, user.id),
          ),
          and(
            eq(conversation.maxUserId, id),
            eq(conversation.minUserId, user.id),
          ),
        ),
      )
      .where(ne(user.id, id))
      .orderBy(desc(conversation.updatedAt))
      .limit(20)

    return profiles
  },
)
