import { createFileRoute } from '@tanstack/solid-router'
import { Dock, Navbar } from '@/components'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div class="min-h-screen">
      <Navbar />
      <Dock />
    </div>
  )
}
