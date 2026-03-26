import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { and, desc, eq, sql } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SUBJECTS } from '@/lib/constants'
import { infoCard, infoCardVote } from '@/schemas/info'
import { awardBadge } from '@/server/badge.server'

function parseSubjects(value: string): Array<string> {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

export const getInfoCards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    const cards = await db
      .select()
      .from(infoCard)
      .orderBy(desc(infoCard.createdAt))

    const allVotes = await db
      .select({
        cardId: infoCardVote.cardId,
        score: sql<number>`COALESCE(SUM(${infoCardVote.value}), 0)`,
      })
      .from(infoCardVote)
      .groupBy(infoCardVote.cardId)

    const userVotes = session
      ? await db
          .select({
            cardId: infoCardVote.cardId,
            value: infoCardVote.value,
          })
          .from(infoCardVote)
          .where(eq(infoCardVote.userId, session.user.id))
      : []

    const scoreMap = new Map(allVotes.map((v) => [v.cardId, v.score]))
    const userVoteMap = new Map(userVotes.map((v) => [v.cardId, v.value]))

    return cards.map((card) => ({
      ...card,
      subjects: parseSubjects(card.subjects),
      score: scoreMap.get(card.id) ?? 0,
      userVote: userVoteMap.get(card.id) ?? null,
    }))
  },
)

export const createInfoCard = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { title: string; content: string; subjects: Array<string> }) =>
      input,
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const title = data.title.trim()
    const content = data.content.trim()
    const subjects = data.subjects
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => SUBJECTS.includes(s as (typeof SUBJECTS)[number]))

    if (!title || !content) {
      throw new Error('Title and content are required')
    }

    if (subjects.length === 0) {
      subjects.push('General')
    }

    const userCardCount = await db
      .select()
      .from(infoCard)
      .where(eq(infoCard.authorId, session.user.id))
      .limit(1)

    const isFirstCard = userCardCount.length === 0

    const [newCard] = await db
      .insert(infoCard)
      .values({
        id: crypto.randomUUID(),
        title,
        content,
        subjects: JSON.stringify(subjects),
        authorId: session.user.id,
        authorName: session.user.name,
      })
      .returning()

    if (isFirstCard) {
      try {
        await awardBadge(session.user.id, 'first-share')
      } catch (error) {
        console.error('Failed to award first share badge:', error)
      }
    }

    return { ...newCard, subjects, score: 0, userVote: null }
  })

export const updateInfoCard = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      id: string
      title: string
      content: string
      subjects: Array<string>
    }) => input,
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const id = data.id.trim()
    const title = data.title.trim()
    const content = data.content.trim()
    const subjects = data.subjects
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => SUBJECTS.includes(s as (typeof SUBJECTS)[number]))

    if (!id) {
      throw new Error('Card ID is required')
    }

    if (!title || !content) {
      throw new Error('Title and content are required')
    }

    if (subjects.length === 0) {
      subjects.push('General')
    }

    const cards = await db
      .select()
      .from(infoCard)
      .where(eq(infoCard.id, id))
      .limit(1)

    if (cards.length === 0) {
      throw new Error('Card not found')
    }

    const card = cards[0]
    if (card.authorId !== session.user.id) {
      throw new Error('You can only edit your own cards')
    }

    const [updatedCard] = await db
      .update(infoCard)
      .set({
        title,
        content,
        subjects: JSON.stringify(subjects),
      })
      .where(eq(infoCard.id, id))
      .returning()

    return {
      ...updatedCard,
      subjects,
    }
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

export const voteInfoCard = createServerFn({ method: 'POST' })
  .inputValidator((input: { cardId: string; value: number }) => input)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    if (data.value !== 1 && data.value !== -1) {
      throw new Error('Vote value must be 1 or -1')
    }

    // Prevent voting on own cards
    const cards = await db
      .select({ authorId: infoCard.authorId })
      .from(infoCard)
      .where(eq(infoCard.id, data.cardId))
      .limit(1)

    if (cards.length === 0) {
      throw new Error('Card not found')
    }

    if (cards[0].authorId === session.user.id) {
      throw new Error('You cannot vote on your own card')
    }

    // Check for existing vote
    const existing = await db
      .select()
      .from(infoCardVote)
      .where(
        and(
          eq(infoCardVote.cardId, data.cardId),
          eq(infoCardVote.userId, session.user.id),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      if (existing[0].value === data.value) {
        // Same vote = undo (remove vote)
        await db.delete(infoCardVote).where(eq(infoCardVote.id, existing[0].id))
        return { userVote: null }
      } else {
        // Different vote = update
        await db
          .update(infoCardVote)
          .set({ value: data.value })
          .where(eq(infoCardVote.id, existing[0].id))
        return { userVote: data.value }
      }
    } else {
      // No existing vote = insert
      await db.insert(infoCardVote).values({
        id: crypto.randomUUID(),
        cardId: data.cardId,
        userId: session.user.id,
        value: data.value,
      })
      return { userVote: data.value }
    }
  })
