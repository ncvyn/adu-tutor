import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { middleware } from '@/lib/middleware'
import { user } from '@/schemas/auth'

type UpdateSettingsInput = {
  bio: string
  preferredSubject: string
  availability?: string
}

export const updateSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSettingsInput) => input)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db
      .update(user)
      .set({
        bio: data.bio.trim(),
        preferredSubject: data.preferredSubject.trim(),
        availability: data.availability?.trim() || null,
      })
      .where(eq(user.id, session.user.id))

    return { success: true }
  })
