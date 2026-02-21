import { DurableObject } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import { message as messageTable } from '@/schemas/chat'

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
  async fetch(request: Request): Promise<Response> {
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

      if (data.type !== 'message' || !data.content?.trim()) return

      // Persist to D1
      const db = drizzle(this.env.adu_tutor_d1)
      const now = Date.now()
      const id = crypto.randomUUID()

      await db.insert(messageTable).values({
        id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content.trim(),
      })

      // Broadcast to all connected sockets (including sender for confirmation)
      const outgoing: OutgoingMessage = {
        type: 'message',
        id,
        conversationId: data.conversationId,
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
    ws.close(code, reason)
  }

  async webSocketError(ws: WebSocket) {
    ws.close(1011, 'Unexpected error')
  }
}
