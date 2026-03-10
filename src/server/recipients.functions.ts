import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { or, eq, inArray } from 'drizzle-orm'
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
    const convs = await db
      .select()
      .from(conversation)
      .where(or(eq(conversation.minUserId, id), eq(conversation.maxUserId, id)))
    if (convs.length === 0) return []

    const recipientIds = convs.map((card) =>
      card.minUserId !== id ? card.minUserId : card.maxUserId,
    )

    const profiles = await db
      .select()
      .from(user)
      .where(inArray(user.id, recipientIds))
    return profiles
  },
)
