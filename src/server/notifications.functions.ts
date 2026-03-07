import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { middleware } from '@/lib/middleware'
import { notification } from '@/schemas/noti'

export const getMyNotifications = createServerFn({ method: 'GET' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    return db
      .select()
      .from(notification)
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt))
  })

export const dismissNotification = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db
      .delete(notification)
      .where(
        and(
          eq(notification.id, data.id),
          eq(notification.userId, session.user.id),
        ),
      )

    return { success: true }
  })

export const clearNotifications = createServerFn({ method: 'POST' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db
      .delete(notification)
      .where(eq(notification.userId, session.user.id))
    return { success: true }
  })
