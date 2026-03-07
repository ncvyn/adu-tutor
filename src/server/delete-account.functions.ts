import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { middleware } from '@/lib/middleware'
import { user } from '@/schemas/auth'

export const deleteMyAccount = createServerFn({ method: 'POST' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db.delete(user).where(eq(user.id, session.user.id))
    return { success: true }
  })
