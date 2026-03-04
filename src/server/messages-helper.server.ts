export interface ConversationDetails {
  conversation: Conversation | null
  messages: Array<Message>
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  minUserId: string
  maxUserId: string
}

export function getConversationPair(s: string, r: string) {
  return s.localeCompare(r) <= 0
    ? { minUserId: s, maxUserId: r }
    : { minUserId: r, maxUserId: s }
}
