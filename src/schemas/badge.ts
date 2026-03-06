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

export const badge = sqliteTable('badge', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  svgFilename: text('svg_filename').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

export const userBadge = sqliteTable(
  'user_badge',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id')
      .notNull()
      .references(() => badge.id, { onDelete: 'cascade' }),
    awardedAt: integer('awarded_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_badge_unique_idx').on(table.userId, table.badgeId),
    index('user_badge_userId_idx').on(table.userId),
    index('user_badge_badgeId_idx').on(table.badgeId),
  ],
)

export const badgeRelations = relations(badge, ({ many }) => ({
  userBadges: many(userBadge),
}))

export const userBadgeRelations = relations(userBadge, ({ one }) => ({
  user: one(user, {
    fields: [userBadge.userId],
    references: [user.id],
  }),
  badge: one(badge, {
    fields: [userBadge.badgeId],
    references: [badge.id],
  }),
}))

export type Badge = typeof badge.$inferSelect
export type NewBadge = typeof badge.$inferInsert
export type UserBadge = typeof userBadge.$inferSelect
export type NewUserBadge = typeof userBadge.$inferInsert
