import { DurableObject } from 'cloudflare:workers'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  conversation as conversationTable,
  message as messageTable,
} from '@/schemas/chat'

type IncomingMessage =
  | {
      type: 'message'
      conversationId?: string
      senderId: string
      recipientId: string
      content: string
    }
  | {
      type: 'delete'
      messageId: string
      senderId: string
      conversationId?: string
    }

interface OutgoingMessage {
  type: 'message'
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: number
}

interface OutgoingDeleteMessage {
  type: 'delete'
  messageId: string
  conversationId: string
  senderId: string
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
    let data: IncomingMessage
    try {
      data = JSON.parse(raw as string) as IncomingMessage
    } catch (err) {
      console.error('Invalid WebSocket payload:', err)
      return
    }

    if (data.type === 'delete') {
      if (!data.senderId || !data.messageId || !data.conversationId) return

      const outgoing: OutgoingDeleteMessage = {
        type: 'delete',
        messageId: data.messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
      }

      const payload = JSON.stringify(outgoing)

      for (const socket of this.ctx.getWebSockets()) {
        try {
          socket.send(payload)
        } catch {
          // Socket is likely closed
        }
      }

      return
    }

    if (!data.content.trim()) return
    if (!data.senderId || !data.recipientId) return

    const now = Date.now()
    const id = crypto.randomUUID()

    let conversationId = data.conversationId

    if (!conversationId) {
      const [minUserId, maxUserId] =
        data.senderId.localeCompare(data.recipientId) <= 0
          ? [data.senderId, data.recipientId]
          : [data.recipientId, data.senderId]

      const rows = await db
        .select()
        .from(conversationTable)
        .where(
          and(
            eq(conversationTable.minUserId, minUserId),
            eq(conversationTable.maxUserId, maxUserId),
          ),
        )
        .limit(1)

      if (rows.length > 0) {
        conversationId = rows[0].id
      } else {
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

    if (!conversationId) return

    const trimmedContent = data.content.trim()

    await db.batch([
      db.insert(messageTable).values({
        id,
        conversationId,
        senderId: data.senderId,
        content: trimmedContent,
      }),
      db
        .update(conversationTable)
        .set({ updatedAt: new Date(now) })
        .where(eq(conversationTable.id, conversationId)),
    ])

    const outgoing: OutgoingMessage = {
      type: 'message',
      id,
      conversationId,
      senderId: data.senderId,
      content: trimmedContent,
      createdAt: now,
    }

    const payload = JSON.stringify(outgoing)

    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(payload)
      } catch {
        // Socket is likely closed
      }
    }
  }
}
