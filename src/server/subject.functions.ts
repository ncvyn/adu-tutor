import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/schemas/auth'
import { eq } from 'drizzle-orm'
import { middleware } from '@/lib/middleware'

export const getUserSubjects = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId: string }) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const result = await db
      .select({ preferredSubjects: user.preferredSubjects })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1)
    if (result.length === 0) return []
    try {
      return JSON.parse(result[0].preferredSubjects)
    } catch (e) {
      return []
    }
  })

export const getMySubjects = createServerFn({ method: 'GET' })
  .middleware([middleware])
  .handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')
    const result = await db
      .select({ preferredSubjects: user.preferredSubjects })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
    if (result.length === 0) return []
    try {
      return JSON.parse(result[0].preferredSubjects)
    } catch (e) {
      return []
    }
  })

export const setSubjects = createServerFn({ method: 'POST' })
  .inputValidator((data: { subjects: Array<string> }) => data)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const MAXIMUM_SUBJECTS = 5
    const uniqueSubjects = Array.from(
      new Set(data.subjects.map((s) => s.trim()).filter(Boolean)),
    ).slice(0, MAXIMUM_SUBJECTS)

    await db
      .update(user)
      .set({ preferredSubjects: JSON.stringify(uniqueSubjects) })
      .where(eq(user.id, session.user.id))

    return { success: true, subjects: uniqueSubjects }
  })
