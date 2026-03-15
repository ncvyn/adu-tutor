import { Show } from 'solid-js'

interface HeaderProps {
  cardCountLabel: string
  isRefreshing: boolean
  onShare: () => void
}

export function Header(props: HeaderProps) {
  return (
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Info Hub</h1>
        <div class="flex items-center gap-2">
          <p class="text-sm opacity-70">{props.cardCountLabel}</p>
          <Show when={props.isRefreshing}>
            <span class="loading loading-xs loading-spinner opacity-70" />
          </Show>
        </div>
      </div>

      <button class="btn btn-primary" onClick={props.onShare}>
        Share Info
      </button>
    </div>
  )
}
