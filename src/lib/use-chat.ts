import { createSignal, onCleanup } from 'solid-js'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: number
}

interface ChatOptions {
  senderId: string
  recipientId: string
}

export function useChat(options: ChatOptions) {
  const [messages, setMessages] = createSignal<ChatMessage[]>([])
  const [isConnected, setIsConnected] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)

  let ws: WebSocket | null = null

  const { senderId, recipientId } = options
  const params = `s=${senderId}&r=${recipientId}`

  // Fetch existing message history via the REST endpoint
  async function loadHistory() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/messages?${params}`)
      if (res.ok) {
        const data = (await res.json()) as {
          conversation: unknown
          messages: ChatMessage[]
        }
        setMessages(data.messages)
      }
    } catch {
      // History fetch failed, start with empty
    } finally {
      setIsLoading(false)
    }
  }

  // Open WebSocket connection
  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${protocol}//${window.location.host}/api/ws?${params}`)

    ws.addEventListener('open', () => {
      setIsConnected(true)
    })

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ChatMessage & { type: string }
        if (data.type === 'message') {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              content: data.content,
              createdAt: data.createdAt,
            },
          ])
        }
      } catch {
        // Ignore malformed messages
      }
    })

    ws.addEventListener('close', () => {
      setIsConnected(false)
    })

    ws.addEventListener('error', () => {
      setIsConnected(false)
    })
  }

  // Send a message through the WebSocket
  function send(conversationId: string, content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'message',
        conversationId,
        senderId,
        content,
      }),
    )
  }

  // Disconnect the WebSocket
  function disconnect() {
    if (ws) {
      ws.close()
      ws = null
    }
  }

  // Start everything
  loadHistory().then(() => connect())

  // Cleanup on component unmount
  onCleanup(() => disconnect())

  return {
    messages,
    isConnected,
    isLoading,
    send,
    disconnect,
  }
}
