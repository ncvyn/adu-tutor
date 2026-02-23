import { createFileRoute } from '@tanstack/solid-router'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { drizzle } from 'drizzle-orm/d1'
import { and, asc, eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { auth } from '@/lib/auth'
import { conversation, message } from '@/schemas/chat'

function getConversationPair(s: string, r: string) {
  return s.localeCompare(r) <= 0
    ? { minUserId: s, maxUserId: r }
    : { minUserId: r, maxUserId: s }
}

async function validateRequest(request: Request) {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      }),
    }
  }

  const url = new URL(request.url)
  const s = url.searchParams.get('s')
  const r = url.searchParams.get('r')

  if (!s || !r) {
    return {
      error: new Response(JSON.stringify({ error: 'Missing s or r param' }), {
        status: 400,
      }),
    }
  }

  if (s === r) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Cannot message yourself' }),
        { status: 400 },
      ),
    }
  }

  if (session.user.id !== s) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Sender does not match session' }),
        { status: 403 },
      ),
    }
  }

  const db = drizzle(env.adu_tutor_d1)
  const { minUserId, maxUserId } = getConversationPair(s, r)

  const [existingConversation] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.minUserId, minUserId),
        eq(conversation.maxUserId, maxUserId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null)

  return { session, s, r, db, minUserId, maxUserId, existingConversation }
}

export const Route = createFileRoute('/api/messages')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const result = await validateRequest(request)
        if ('error' in result) return result.error

        const { existingConversation, db } = result

        if (!existingConversation) {
          return Response.json({ conversation: null, messages: [] })
        }

        const messages = await db
          .select()
          .from(message)
          .where(eq(message.conversationId, existingConversation.id))
          .orderBy(asc(message.createdAt))

        return Response.json({
          conversation: existingConversation,
          messages,
        })
      },

      POST: async ({ request }: { request: Request }) => {
        const result = await validateRequest(request)
        if ('error' in result) return result.error

        const { s, db, minUserId, maxUserId } = result
        let { existingConversation } = result

        const body = (await request.json().catch(() => null)) as {
          content?: string
        } | null

        if (!body || typeof body.content !== 'string' || !body.content.trim()) {
          return new Response(
            JSON.stringify({ error: 'Message content is required' }),
            { status: 400 },
          )
        }

        if (!existingConversation) {
          const [created] = await db
            .insert(conversation)
            .values({
              id: crypto.randomUUID(),
              minUserId,
              maxUserId,
            })
            .returning()

          existingConversation = created
        }

        const [newMessage] = await db
          .insert(message)
          .values({
            id: crypto.randomUUID(),
            conversationId: existingConversation.id,
            senderId: s,
            content: body.content.trim(),
          })
          .returning()

        return Response.json({
          conversation: existingConversation,
          message: newMessage,
        })
      },
    },
  },
})
