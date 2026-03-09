import type { JSX } from 'solid-js'
import { Sidebar } from '@/components/Sidebar'
import { ProfileDropdown } from '@/components/ProfileDropdown'
import { Dock } from '@/components/Dock'

export function AuthenticatedLayout(props: { children: JSX.Element }) {
  return (
    <div class="flex h-dvh flex-col md:flex-row">
      {/* Desktop sidebar - hidden on mobile */}
      <aside class="hidden w-75 shrink-0 md:flex">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div class="flex min-h-0 flex-1 flex-col">
        {/* Desktop top bar with profile dropdown */}
        <header class="hidden items-center justify-between border-b border-base-300 bg-base-100 px-6 py-3 md:flex">
          <div />
          <ProfileDropdown />
        </header>

        {/* Scrollable content area */}
        <main class="min-h-0 flex-1 overflow-auto bg-base-200 pb-18 md:pb-0">
          {props.children}
        </main>
      </div>

      {/* Mobile dock - hidden on desktop */}
      <Dock />
    </div>
  )
}
