import { LibraryBig, MessageCircle, UserRound } from 'lucide-solid'

export default function Dock() {
  return (
    <div class="dock dock-xl">
      <button>
        <MessageCircle />
        <span class="dock-label">Messages</span>
      </button>

      <button>
        <LibraryBig />
        <span class="dock-label">Info Hub</span>
      </button>

      <button>
        <UserRound />
        <span class="dock-label">Profile</span>
      </button>
    </div>
  )
}
