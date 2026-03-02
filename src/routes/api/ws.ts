import { createFileRoute } from '@tanstack/solid-router'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import { inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { middleware } from '@/lib/middleware'
import { user } from '@/schemas/auth'

function getConversationPair(s: string, r: string) {
  return s.localeCompare(r) <= 0
    ? { minUserId: s, maxUserId: r }
    : { minUserId: r, maxUserId: s }
}

export const Route = createFileRoute('/api/ws')({
  server: {
    middleware: [middleware],
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const headers = getRequestHeaders()
        const session = await auth.api.getSession({ headers })
        if (!session) return new Response('Unauthorized', { status: 401 })

        const url = new URL(request.url)
        const s = url.searchParams.get('s')
        const r = url.searchParams.get('r')

        if (!s || !r) return new Response('Missing params', { status: 400 })

        if (s === r)
          return new Response('Cannot message yourself', { status: 400 })

        if (session.user.id !== s)
          return new Response('Sender does not match session', { status: 403 })

        const db = drizzle(env.adu_tutor_d1)
        const rows = await db
          .select({ id: user.id })
          .from(user)
          .where(inArray(user.id, [s, r]))
        if (rows.length !== 2)
          return new Response('Invalid sender/receiver', { status: 400 })

        const upgradeHeader = request.headers.get('Upgrade')
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
          return new Response('Expected WebSocket upgrade', { status: 426 })
        }

        const { minUserId, maxUserId } = getConversationPair(s, r)
        const roomId = env.CHAT_ROOM.idFromName(`${minUserId}:${maxUserId}`)
        const room = env.CHAT_ROOM.get(roomId)

        const doUrl = new URL(request.url)
        doUrl.searchParams.set('userId', s)

        return room.fetch(new Request(doUrl, request))
      },
    },
  },
})
