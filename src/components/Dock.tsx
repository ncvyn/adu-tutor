import { Link } from '@tanstack/solid-router'

import { BookCopy, MessageCircle, UserRound } from 'lucide-solid'

export const Dock = () => {
  return (
    <div class="dock dock-lg lg:flex xl:hidden">
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
  )
}
