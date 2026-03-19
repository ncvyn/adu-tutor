import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'
import { env } from 'cloudflare:workers'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { account, session, user, verification } from '@/schemas/auth'
import { createAuthMiddleware } from 'better-auth/api'
import { awardBadge } from '@/server/badge.server'
import { eq } from 'drizzle-orm'

const schema = { user, session, account, verification }
const db = drizzle(env.adu_tutor_d1, { schema })

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema,
  }),
  socialProviders: {
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenantId: env.MICROSOFT_TENANT_ID,
      prompt: 'select_account',
    },
  },
  user: {
    additionalFields: {
      banned: {
        type: 'boolean',
        required: true,
        defaultValue: false,
        input: false,
      },
      role: {
        type: ['tutor', 'tutee'],
        required: true,
        defaultValue: 'tutee',
        input: false,
      },
      bio: {
        type: 'string',
        required: true,
        defaultValue: '',
        input: false,
      },
      preferredSubjects: {
        type: 'json',
        required: true,
        defaultValue: [],
        input: false,
      },
      availability: {
        type: 'string',
        required: true,
        defaultValue: '',
        input: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 600, // seconds
      strategy: 'compact',
    },
  },
  plugins: [tanstackStartCookies()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession
      if (newSession) {
        const userId = newSession.session.userId

        const rows = await db
          .select({ createdAt: schema.user.createdAt })
          .from(schema.user)
          .where(eq(schema.user.id, userId))
        if (rows.length !== 0) {
          const createdAt = new Date(rows[0].createdAt)
          const now = new Date()
          const thresholdMs = 60_000 // 1 minute

          if (now.getTime() - createdAt.getTime() < thresholdMs) {
            await awardBadge(userId, 'newcomer')
          }
        }
      }
    }),
  },
})
