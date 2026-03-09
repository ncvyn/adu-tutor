import { QueryClient } from '@tanstack/solid-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 3,
    },
    mutations: {
      retry: 0,
    },
  },
})

export type EntityQueryKey = [
  entity: string,
  id?: string | number | null,
  ...params: Array<string | number | boolean | null | undefined>,
]
