import { createSignal, onMount } from 'solid-js'
import { useAuthGuard, type AuthGuardOptions } from '@/lib/auth-client'

type SessionReadyOptions = AuthGuardOptions & {
  /** Minimum time in milliseconds to show the loading screen. Default: 200 */
  minDelay?: number
}

export function useSessionReady(options: SessionReadyOptions = {}) {
  const { minDelay = 200, ...authOptions } = options

  const session = useAuthGuard(authOptions)
  const [minDelayPassed, setMinDelayPassed] = createSignal(false)

  onMount(() => {
    setTimeout(() => setMinDelayPassed(true), minDelay)
  })

  const isReady = () => !session().isPending && minDelayPassed()

  return { session, isReady }
}
