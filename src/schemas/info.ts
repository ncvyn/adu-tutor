import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { user } from '@/schemas/auth'

export const infoCard = sqliteTable(
  'info_card',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    subjects: text('subjects').default('["General"]').notNull(),
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

export const infoCardVote = sqliteTable(
  'info_card_vote',
  {
    id: text('id').primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => infoCard.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
  },
  (table) => [
    uniqueIndex('info_card_vote_card_user_idx').on(table.cardId, table.userId),
    index('info_card_vote_card_idx').on(table.cardId),
  ],
)

export const infoCardRelations = relations(infoCard, ({ one, many }) => ({
  author: one(user, {
    fields: [infoCard.authorId],
    references: [user.id],
  }),
  votes: many(infoCardVote),
}))

export const infoCardVoteRelations = relations(infoCardVote, ({ one }) => ({
  card: one(infoCard, {
    fields: [infoCardVote.cardId],
    references: [infoCard.id],
  }),
  user: one(user, {
    fields: [infoCardVote.userId],
    references: [user.id],
  }),
}))

export type InfoCard = typeof infoCard.$inferSelect

export type InfoCardWithVotes = Omit<InfoCard, 'subjects'> & {
  subjects: string[]
  score: number
  userVote: number | null
}
