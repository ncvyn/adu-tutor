import { createContext, createSignal, useContext } from 'solid-js'
import type { JSX } from 'solid-js'
import type { UserResult } from '@/components/messages/SearchUsers'

interface ChatContextValue {
  selectedRecipient: () => UserResult | null
  setSelectedRecipient: (user: UserResult | null) => void
}

const ChatContext = createContext<ChatContextValue>()

export function ChatProvider(props: { children: JSX.Element }) {
  const [selectedRecipient, setSelectedRecipient] =
    createSignal<UserResult | null>(null)

  return (
    <ChatContext.Provider value={{ selectedRecipient, setSelectedRecipient }}>
      {props.children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return ctx
}
