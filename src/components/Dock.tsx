import { BookCopy, MessageCircle, UserRound } from 'lucide-solid'

export const Dock = () => {
  return (
    <div class="dock dock-lg lg:flex xl:hidden">
      <button>
        <MessageCircle />
        <span class="dock-label">Messages</span>
      </button>

      <button>
        <BookCopy />
        <span class="dock-label">Info Hub</span>
      </button>

      <button>
        <UserRound />
        <span class="dock-label">Profile</span>
      </button>
    </div>
  )
}
