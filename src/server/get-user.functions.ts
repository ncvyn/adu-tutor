import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { user } from '@/schemas/auth'
import { middleware } from '@/lib/middleware'
import { db } from '@/lib/db'

export const getUser = createServerFn({ method: 'GET' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) throw new Error('Unauthorized')

    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    return foundUser
  })
