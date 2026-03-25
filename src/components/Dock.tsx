import { Link } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { BookCopy, MessageCircle, UserRound } from 'lucide-solid'

import { dockVisible } from '@/lib/dock-visible'

export const Dock = () => {
  return (
    <Show when={dockVisible()}>
      <div class="dock dock-lg md:hidden">
        <Link to="/messages" activeProps={{ class: 'dock-active' }}>
          <MessageCircle />
          <span class="dock-label select-none">Messages</span>
        </Link>

        <Link to="/info-hub" activeProps={{ class: 'dock-active' }}>
          <BookCopy />
          <span class="dock-label select-none">Info Hub</span>
        </Link>

        <Link to="/profile" activeProps={{ class: 'dock-active' }}>
          <UserRound />
          <span class="dock-label select-none">Profile</span>
        </Link>
      </div>
    </Show>
  )
}
