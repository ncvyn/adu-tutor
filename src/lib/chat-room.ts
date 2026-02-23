import { DurableObject } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq } from 'drizzle-orm'
import {
  conversation as conversationTable,
  message as messageTable,
} from '@/schemas/chat'

interface IncomingMessage {
  type: 'message'
  conversationId: string
  senderId: string
  content: string
}

interface OutgoingMessage {
  type: 'message'
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: number
}

export class ChatRoom extends DurableObject<Env> {
  fetch(request: Request): Response {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return new Response('Missing userId', { status: 400 })
    }

    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.ctx.acceptWebSocket(server, [userId])

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(_ws: WebSocket, raw: string | ArrayBuffer) {
    try {
      const data = JSON.parse(raw as string) as IncomingMessage

      if (!data.content.trim()) return

      // Persist to D1
      const db = drizzle(this.env.adu_tutor_d1)
      const now = Date.now()
      const id = crypto.randomUUID()

      // Find or create conversation if conversationId is missing
      let conversationId = data.conversationId

      if (!conversationId) {
        // Extract minUserId and maxUserId from connected socket tags
        // or derive from the Durable Object name
        const tags = this.ctx
          .getWebSockets()
          .flatMap((s) => this.ctx.getTags(s))
        const uniqueUserIds = [...new Set(tags)].sort()
        const [minUserId, maxUserId] = uniqueUserIds

        if (minUserId && maxUserId) {
          // Try to find existing conversation
          const [existing] = await db
            .select()
            .from(conversationTable)
            .where(
              and(
                eq(conversationTable.minUserId, minUserId),
                eq(conversationTable.maxUserId, maxUserId),
              ),
            )
            .limit(1)

          if (existing) {
            conversationId = existing.id
          } else {
            // Create a new conversation
            const [created] = await db
              .insert(conversationTable)
              .values({
                id: crypto.randomUUID(),
                minUserId,
                maxUserId,
              })
              .returning()
            conversationId = created.id
          }
        }
      }

      if (!conversationId) return // Still can't determine conversation

      await db.insert(messageTable).values({
        id,
        conversationId,
        senderId: data.senderId,
        content: data.content.trim(),
      })

      // Broadcast to all connected sockets (including sender for confirmation)
      const outgoing: OutgoingMessage = {
        type: 'message',
        id,
        conversationId,
        senderId: data.senderId,
        content: data.content.trim(),
        createdAt: now,
      }

      const payload = JSON.stringify(outgoing)

      for (const socket of this.ctx.getWebSockets()) {
        try {
          socket.send(payload)
        } catch {
          // Socket is likely closed, will be cleaned up on close event
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    // The WebSocket is already closing/closed; no need to call ws.close() again.
    // Cloudflare's Hibernation API handles cleanup automatically.
  }

  async webSocketError(ws: WebSocket) {
    await ws.close(1011, 'Unexpected error')
  }
}
