import { createServerFn } from '@tanstack/solid-start'
import { db } from '@/lib/db'
import { cohort } from '@/schemas/cohort'

export const getCohortMembers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.select().from(cohort)
  },
)
