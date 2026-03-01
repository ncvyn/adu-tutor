import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { user } from '@/schemas/auth'

export const infoCard = sqliteTable(
  'info_card',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    authorName: text('author_name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('info_card_author_idx').on(table.authorId)],
)

export const infoCardRelations = relations(infoCard, ({ one }) => ({
  author: one(user, {
    fields: [infoCard.authorId],
    references: [user.id],
  }),
}))

export type InfoCard = typeof infoCard.$inferSelect
