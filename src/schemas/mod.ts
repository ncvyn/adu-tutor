import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { user } from '@/schemas/auth'
import { message } from '@/schemas/chat'

export const tutorApplication = sqliteTable('tutor_application', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

export const report = sqliteTable('report', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  reportedMessageId: text('reported_message_id')
    .notNull()
    .references(() => message.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})
