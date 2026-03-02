import { createSignal, onCleanup } from 'solid-js'
import { useNotifications } from '@/components'

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

interface Conversation {
  id: string
  minUserId: string
  maxUserId: string
}

interface MessagesApiResponse {
  conversation: Conversation | null
  messages: Array<ChatMessage>
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
      const res = await fetch(`/api/messages?${params}`)
      if (res.ok) {
        const data: MessagesApiResponse = await res.json()
        setMessages(data.messages)

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

  function scheduleReconnect() {
    if (isIntentionallyClosed) return

    console.log(`[WS] Scheduling reconnect in ${reconnectDelay}ms`)
    reconnectTimeout = setTimeout(() => {
      console.log('[WS] Attempting reconnect...')
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
    console.log('[WS] Connecting to:', wsUrl)
    ws = new WebSocket(wsUrl)

    ws.addEventListener('open', () => {
      console.log('[WS] Connected!')
      setIsConnected(true)

      reconnectDelay = INITIAL_RECONNECT_DELAY
    })

    ws.addEventListener('message', (event) => {
      console.log('[WS] Raw message received:', event.data)
      try {
        const data = JSON.parse(event.data) as ChatMessage & { type: string }
        console.log('[WS] Parsed message:', data)
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
            console.log('[WS] Updated messages array:', newMessages)
            return newMessages
          })
        }
      } catch (err) {
        console.error('[WS] Parse error:', err)
        notify({
          type: 'warning',
          message: 'Malformed message received.',
        })
      }
    })

    ws.addEventListener('close', (event) => {
      console.log('[WS] Closed:', event.code, event.reason)
      setIsConnected(false)
      ws = null
      scheduleReconnect()
    })

    ws.addEventListener('error', (event) => {
      console.error('[WS] Error:', event)
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
