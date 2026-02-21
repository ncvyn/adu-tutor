import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  { ignores: ['src/schemas/*', '.wrangler/*'] },
]
