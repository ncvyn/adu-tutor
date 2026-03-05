import { createServerFn } from '@tanstack/solid-start'

import { and, asc, eq } from 'drizzle-orm'
import type {ConversationDetails} from '@/server/helper.server';
import { db } from '@/lib/db'

import { conversation, message } from '@/schemas/chat'
import {
  
  getConversationPair
} from '@/server/helper.server'
import { middleware } from '@/lib/middleware'

export const getMessages = createServerFn({ method: 'GET' })
  .inputValidator((data: { senderId: string; recipientId: string }) => data)
  .middleware([middleware])
  .handler(async ({ data }) => {
    const { senderId: s, recipientId: r } = data
    const { minUserId, maxUserId } = getConversationPair(s, r)

    const conversations = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.minUserId, minUserId),
          eq(conversation.maxUserId, maxUserId),
        ),
      )
      .limit(1)

    if (conversations.length === 0)
      return { conversation: null, messages: [] } as ConversationDetails
    const existingConversation = conversations[0]

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, existingConversation.id))
      .orderBy(asc(message.createdAt))

    return {
      conversation: existingConversation,
      messages: messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      })),
    } as ConversationDetails
  })

export const addMessage = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { senderId: string; recipientId: string; content: string }) => data,
  )
  .middleware([middleware])
  .handler(async ({ data }) => {
    const { senderId: sender, recipientId: receiver, content } = data

    if (!content.trim())
      return { conversation: null, messages: [] } as ConversationDetails

    const { minUserId, maxUserId } = getConversationPair(sender, receiver)

    const conversations = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.minUserId, minUserId),
          eq(conversation.maxUserId, maxUserId),
        ),
      )
      .limit(1)

    let existingConversation = conversations[0]
    if (conversations.length === 0) {
      const [createdConversation] = await db
        .insert(conversation)
        .values({
          id: crypto.randomUUID(),
          minUserId,
          maxUserId,
        })
        .returning()

      existingConversation = createdConversation
    }

    const [newMessage] = await db
      .insert(message)
      .values({
        id: crypto.randomUUID(),
        conversationId: existingConversation.id,
        senderId: sender,
        content: content.trim(),
      })
      .returning()

    return {
      conversation: existingConversation,
      messages: [
        {
          ...newMessage,
          createdAt: newMessage.createdAt.toISOString(),
        },
      ],
    } as ConversationDetails
  })
