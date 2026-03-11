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
