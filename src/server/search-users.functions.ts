import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { and, like, ne } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { user } from '@/schemas/auth'
import { auth } from '@/lib/auth'

export const searchUsers = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const db = drizzle(env.adu_tutor_d1)

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
          ne(user.role, session.user.role),
          ne(user.banned, true),
        ),
      )
      .limit(10)

    return results
  })
