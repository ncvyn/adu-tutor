import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'
import { env } from 'cloudflare:workers'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { user, session, account, verification } from '@/../auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(env.adu_tutor_d1, {
    provider: 'sqlite',
    schema: { user, session, account, verification },
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
        defaultValue: 'tutor',
        input: false,
      },
    },
  },
  plugins: [tanstackStartCookies()],
})
