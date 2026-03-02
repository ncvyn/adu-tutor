import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { auth } from '@/lib/auth'
import { user } from '@/schemas/auth'
import { middleware } from '@/lib/middleware'

export const getUserProfile = createServerFn({ method: 'GET' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const db = drizzle(env.adu_tutor_d1)

    const [userProfile] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    return userProfile
  })
