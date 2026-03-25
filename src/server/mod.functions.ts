import { createServerFn } from '@tanstack/solid-start'
import { getRequestHeaders } from '@tanstack/solid-start/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { report, tutorApplication } from '@/schemas/mod'

export const submitTutorApplication = createServerFn({ method: 'POST' })
  .inputValidator((reason: string) => reason)
  .handler(async ({ data: reason }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db.insert(tutorApplication).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      reason,
    })
    return { success: true }
  })

export const submitReport = createServerFn({ method: 'POST' })
  .inputValidator((input: { messageId: string; reason: string }) => input)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    await db.insert(report).values({
      id: crypto.randomUUID(),
      reporterId: session.user.id,
      reportedMessageId: data.messageId,
      reason: data.reason,
    })
    return { success: true }
  })

export const fetchData = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const tutorApplications = await db.select().from(tutorApplication)
  const reports = await db.select().from(report)

  return { tutorApplications, reports }
})
