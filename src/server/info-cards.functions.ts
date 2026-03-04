import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { infoCard } from '@/schemas/info'

export const getInfoCards = createServerFn({ method: 'GET' }).handler(
  async () => {
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

    const cards = await db
      .select()
      .from(infoCard)
      .where(eq(infoCard.id, data.id))
      .limit(1)
    if (cards.length === 0) {
      throw new Error('Card not found')
    }

    const card = cards[0]
    if (card.authorId !== session.user.id) {
      throw new Error('You can only delete your own cards')
    }

    await db.delete(infoCard).where(eq(infoCard.id, data.id))

    return { success: true }
  })
