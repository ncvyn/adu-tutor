import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid'

export const auth = betterAuth({
  // No database (stateless) configuration

  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    },
  },
  plugins: [tanstackStartCookies()],
})
