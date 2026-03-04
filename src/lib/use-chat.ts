import { createSignal, onCleanup } from 'solid-js'
import { useNotifications } from '@/components'
import { getMessages } from '@/server/messages.functions'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

interface ChatOptions {
  senderId: string
  recipientId: string
}

const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000 // 1 second

export function useChat(options: ChatOptions) {
  const [messages, setMessages] = createSignal<Array<ChatMessage>>([])
  const [isConnected, setIsConnected] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(true)
  const [conversationId, setConversationId] = createSignal<string>('')

  let ws: WebSocket | null = null
  let reconnectDelay = INITIAL_RECONNECT_DELAY
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let isIntentionallyClosed = false

  const { senderId, recipientId } = options
  const params = `s=${senderId}&r=${recipientId}`

  const { notify } = useNotifications()

  async function loadHistory() {
    setIsLoading(true)
    try {
      const data = await getMessages({ data: { senderId, recipientId } })
      setMessages(data.messages)
      if (data.conversation?.id) {
        setConversationId(data.conversation.id)
      }
    } catch (error) {
      notify({
        type: 'error',
        message: `Failed to load message history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  function scheduleReconnect() {
    if (isIntentionallyClosed) return

    reconnectTimeout = setTimeout(() => {
      connect()
    }, reconnectDelay)

    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
  }

  function connect() {
    if (ws) {
      ws.close()
      ws = null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws?${params}`
    ws = new WebSocket(wsUrl)

    ws.addEventListener('open', () => {
      setIsConnected(true)

      reconnectDelay = INITIAL_RECONNECT_DELAY
    })

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ChatMessage & { type: string }
        if (data.type === 'message') {
          if (data.conversationId && !conversationId()) {
            setConversationId(data.conversationId)
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) {
              return prev
            }
            const newMessages = [
              ...prev,
              {
                id: data.id,
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                createdAt: data.createdAt,
              },
            ]
            return newMessages
          })
        }
      } catch (err) {
        notify({
          type: 'warning',
          message: 'Malformed message received.',
        })
      }
    })

    ws.addEventListener('close', () => {
      setIsConnected(false)
      ws = null
      scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      notify({ type: 'error', message: 'WebSocket error occurred.' })
      setIsConnected(false)
    })
  }

  function send(content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'message',
        conversationId: conversationId(),
        senderId,
        recipientId,
        content,
      }),
    )
  }

  function disconnect() {
    isIntentionallyClosed = true
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  loadHistory().then(() => connect())

  onCleanup(() => disconnect())

  return {
    messages,
    isConnected,
    isLoading,
    send,
    disconnect,
  }
}
