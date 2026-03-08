import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'
import { env } from 'cloudflare:workers'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { account, session, user, verification } from '@/schemas/auth'

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
        type: ['tutor', 'tutee', 'mod'],
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
      maxAge: 10 * 60, // in seconds
      strategy: 'compact',
    },
  },
  plugins: [tanstackStartCookies()],
})
