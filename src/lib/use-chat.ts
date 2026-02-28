import { createSignal, onCleanup } from 'solid-js'
import { useNotifications } from '@/components'

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

interface Conversation {
  id: string
  minUserId: string
  maxUserId: string
}

interface MessagesApiResponse {
  conversation: Conversation | null
  messages: Array<ChatMessage>
}

export function useChat(options: ChatOptions) {
  const [messages, setMessages] = createSignal<Array<ChatMessage>>([])
  const [isConnected, setIsConnected] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [conversationId, setConversationId] = createSignal<string>('')

  let ws: WebSocket | null = null

  const { senderId, recipientId } = options
  const params = `s=${senderId}&r=${recipientId}`

  const { notify } = useNotifications()

  // Fetch existing message history via the REST endpoint
  async function loadHistory() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/messages?${params}`)
      if (res.ok) {
        const data: MessagesApiResponse = await res.json()
        setMessages(data.messages)
        // Store the conversation ID if one exists
        if (data.conversation?.id) {
          setConversationId(data.conversation.id)
        }
      } else {
        notify({
          type: 'error',
          message: `Failed to load message history. ${res.statusText}`,
        })
      }
    } catch {
      notify({
        type: 'info',
        message: 'No history found. Creating a new one...',
      })
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
          // Track the conversation ID from incoming messages
          if (data.conversationId && !conversationId()) {
            setConversationId(data.conversationId)
          }
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
        notify({
          type: 'warning',
          message: 'Malformed message received.',
        })
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
  function send(content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'message',
        conversationId: conversationId(), // Pass known ID or empty string
        senderId,
        recipientId,
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
