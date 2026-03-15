import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, eq, like, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
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
          eq(user.banned, false),
        ),
      )
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
