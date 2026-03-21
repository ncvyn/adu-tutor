import { Ellipsis, EllipsisVertical, Search, Share } from 'lucide-solid'

interface FabProps {
  onShare: () => void
  onSearchTutors: () => void
}

export function Fab(props: FabProps) {
  return (
    <div class="fixed right-8 bottom-8 z-50">
      <div class="fab">
        <div
          tabindex={0}
          role="button"
          class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0"
          aria-label="Open quick actions"
        >
          <Ellipsis />
        </div>

        <div class="fab-close">
          <span class="btn mb-16 btn-circle shadow-lg btn-xl btn-primary md:mb-0">
            <EllipsisVertical />
          </span>
        </div>

        <button
          class="btn btn-circle btn-lg"
          type="button"
          onClick={props.onShare}
          aria-label="Share info"
          title="Share Info"
        >
          <Share />
        </button>

        <button
          class="btn btn-circle btn-lg"
          type="button"
          onClick={props.onSearchTutors}
          aria-label="Search tutors"
          title="Search Tutors"
        >
          <Search />
        </button>
      </div>
    </div>
  )
}
