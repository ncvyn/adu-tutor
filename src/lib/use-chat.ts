import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { useNotifications } from '@/components'
import {
  addMessage,
  deleteMessage,
  getMessages,
} from '@/server/messages.functions'

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
  const [isConnected, setIsConnected] = createSignal(false)
  const [conversationId, setConversationId] = createSignal<string>('')

  let ws: WebSocket | null = null
  let reconnectDelay = INITIAL_RECONNECT_DELAY
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let isIntentionallyClosed = false
  let hasConnected = false

  const { senderId, recipientId } = options
  const params = `s=${senderId}&r=${recipientId}`

  const { notify } = useNotifications()
  const queryClient = useQueryClient()

  const messagesQueryKey = () => ['messages', senderId, recipientId] as const

  const historyQuery = useQuery(() => ({
    queryKey: messagesQueryKey(),
    enabled: Boolean(senderId && recipientId),
    queryFn: async () =>
      getMessages({
        data: { senderId, recipientId },
      }),
    staleTime: 10_000,
  }))

  createEffect(() => {
    const data = historyQuery.data
    if (!data?.conversation?.id) return
    setConversationId((prev) => prev || data.conversation!.id)
  })

  function appendMessageToCache(newMessage: ChatMessage) {
    queryClient.setQueryData(messagesQueryKey(), (prev) => {
      const current = prev as
        | {
            conversation: { id: string } | null
            messages: Array<ChatMessage>
          }
        | undefined

      const prevMessages = Array.isArray(current?.messages)
        ? current.messages
        : []

      if (prevMessages.some((m) => m.id === newMessage.id)) {
        return current ?? { conversation: null, messages: prevMessages }
      }

      return {
        conversation: current?.conversation ?? {
          id: newMessage.conversationId,
        },
        messages: [...prevMessages, newMessage],
      }
    })
  }

  function removeMessageFromCache(messageId: string) {
    queryClient.setQueryData(messagesQueryKey(), (prev) => {
      const current = prev as
        | {
            conversation: { id: string } | null
            messages: Array<ChatMessage>
          }
        | undefined

      if (!current) return current

      return {
        conversation: current.conversation,
        messages: current.messages.filter((m) => m.id !== messageId),
      }
    })
  }

  const sendMutation = useMutation(() => ({
    mutationKey: ['messages', 'send', senderId, recipientId] as const,
    mutationFn: async (content: string) =>
      addMessage({
        data: { senderId, recipientId, content },
      }),
    onSuccess: async (result) => {
      const incoming = result.messages[0]
      if (result.messages.length !== 0) {
        setConversationId((prev) => prev || incoming.conversationId)
        appendMessageToCache(incoming)
      } else {
        await queryClient.invalidateQueries({
          queryKey: messagesQueryKey(),
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['recipients'] })
    },
    onError: (error) => {
      notify({
        type: 'error',
        message: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    },
  }))

  const deleteMutation = useMutation(() => ({
    mutationKey: ['messages', 'delete', senderId, recipientId] as const,
    mutationFn: async (messageId: string) =>
      deleteMessage({
        data: { senderId, messageId },
      }),
    onSuccess: (_, deletedMessageId) => {
      removeMessageFromCache(deletedMessageId)
    },
    onError: (error) => {
      notify({
        type: 'error',
        message: `Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    },
  }))

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
        const data = JSON.parse(event.data) as ChatMessage & {
          type: string
          messageId?: string
        }

        if (data.type === 'delete' && data.messageId) {
          removeMessageFromCache(data.messageId)
          return
        }

        if (data.type !== 'message') return

        if (data.conversationId && !conversationId()) {
          setConversationId(data.conversationId)
        }

        appendMessageToCache({
          id: data.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          createdAt: data.createdAt,
        })
        queryClient.invalidateQueries({ queryKey: ['recipients'] })
      } catch {
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
      console.error('WebSocket error occured.')
      setIsConnected(false)
    })
  }

  createEffect(
    on(
      () => historyQuery.isSuccess,
      (isSuccess) => {
        if (!isSuccess || hasConnected) return
        hasConnected = true
        connect()
      },
    ),
  )

  function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message',
          conversationId: conversationId(),
          senderId,
          recipientId,
          content: trimmed,
        }),
      )
      return
    }

    void sendMutation.mutateAsync(trimmed)
  }

  function remove(messageId: string) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'delete',
          messageId,
          conversationId: conversationId(),
          senderId,
          recipientId,
        }),
      )
    }

    void deleteMutation.mutateAsync(messageId)
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

  onCleanup(() => disconnect())

  return {
    messages: () => historyQuery.data?.messages ?? [],
    isConnected,
    isLoading: () => historyQuery.isLoading,
    isSending: () => sendMutation.isPending,
    send,
    remove,
    disconnect,
  }
}
