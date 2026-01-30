import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'

export const auth = betterAuth({
  // No database (stateless) configuration

  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      prompt: 'select_account',
    },
  },
  plugins: [tanstackStartCookies()],
})
