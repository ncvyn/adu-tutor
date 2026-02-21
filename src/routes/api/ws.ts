import { createFileRoute } from '@tanstack/solid-router'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { env } from 'cloudflare:workers'
import { auth } from '@/lib/auth'

function getConversationPair(s: string, r: string) {
  return s.localeCompare(r) <= 0
    ? { minUserId: s, maxUserId: r }
    : { minUserId: r, maxUserId: s }
}

export const Route = createFileRoute('/api/ws')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const headers = getRequestHeaders()
        const session = await auth.api.getSession({ headers })

        if (!session) {
          return new Response('Unauthorized', { status: 401 })
        }

        const url = new URL(request.url)
        const s = url.searchParams.get('s')
        const r = url.searchParams.get('r')

        if (!s || !r) {
          return new Response('Missing s or r param', { status: 400 })
        }

        if (s === r) {
          return new Response('Cannot message yourself', { status: 400 })
        }

        if (session.user.id !== s) {
          return new Response('Sender does not match session', { status: 403 })
        }

        const upgradeHeader = request.headers.get('Upgrade')
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
          return new Response('Expected WebSocket upgrade', { status: 426 })
        }

        // Use the normalized pair as the Durable Object ID
        // so both users connect to the same ChatRoom instance
        const { minUserId, maxUserId } = getConversationPair(s, r)
        const roomId = env.CHAT_ROOM.idFromName(`${minUserId}:${maxUserId}`)
        const room = env.CHAT_ROOM.get(roomId)

        // Forward the request to the Durable Object with the userId
        const doUrl = new URL(request.url)
        doUrl.searchParams.set('userId', s)

        return room.fetch(new Request(doUrl, request))
      },
    },
  },
})
