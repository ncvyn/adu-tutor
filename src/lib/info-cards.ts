import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { desc, eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { auth } from '@/lib/auth'
import { infoCard } from '@/schemas/info'

export const getInfoCards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = drizzle(env.adu_tutor_d1)

    return await db.select().from(infoCard).orderBy(desc(infoCard.createdAt))
  },
)

export const createInfoCard = createServerFn({ method: 'POST' })
  .inputValidator((input: { title: string; content: string }) => input)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const title = data.title.trim()
    const content = data.content.trim()

    if (!title || !content) {
      throw new Error('Title and content are required')
    }

    const db = drizzle(env.adu_tutor_d1)

    const [newCard] = await db
      .insert(infoCard)
      .values({
        id: crypto.randomUUID(),
        title,
        content,
        authorId: session.user.id,
        authorName: session.user.name,
      })
      .returning()

    return newCard
  })

export const deleteInfoCard = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    if (!data.id) {
      throw new Error('Card ID is required')
    }

    const db = drizzle(env.adu_tutor_d1)

    const [existing] = await db
      .select()
      .from(infoCard)
      .where(eq(infoCard.id, data.id))
      .limit(1)

    if (!existing) {
      throw new Error('Card not found')
    }

    if (existing.authorId !== session.user.id) {
      throw new Error('You can only delete your own cards')
    }

    await db.delete(infoCard).where(eq(infoCard.id, data.id))

    return { success: true }
  })
