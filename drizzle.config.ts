import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: [
    'src/schemas/auth.ts',
    'src/schemas/badge.ts',
    'src/schemas/chat.ts',
    'src/schemas/cohort.ts',
    'src/schemas/info.ts',
    'src/schemas/mod.ts',
  ],
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_TOKEN,
  },
})
