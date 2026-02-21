import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { user } from '@/schemas/auth'

export const conversation = sqliteTable(
  'conversation',
  {
    id: text('id').primaryKey(),
    minUserId: text('min_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    maxUserId: text('max_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('conversation_pair_idx').on(table.minUserId, table.maxUserId),
  ],
)

export const message = sqliteTable(
  'message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('message_conversation_idx').on(table.conversationId),
    index('message_sender_idx').on(table.senderId),
  ],
)

// Relations

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  minUser: one(user, {
    fields: [conversation.minUserId],
    references: [user.id],
    relationName: 'minUser',
  }),
  maxUser: one(user, {
    fields: [conversation.maxUserId],
    references: [user.id],
    relationName: 'maxUser',
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
}))
