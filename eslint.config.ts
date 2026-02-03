import { tanstackConfig } from '@tanstack/eslint-config'

export default [...tanstackConfig, { ignores: ['auth-schema.ts'] }]
