import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const cohort = sqliteTable('cohort', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
})

export type CohortMember = {
  id: string
  name: string
  role: string
}
