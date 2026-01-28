import { createFileRoute } from '@tanstack/solid-router'
import Dock from '@/components/Dock'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div class="min-h-screen">
      <p>Welcome to AdU-Tutor</p>
      <button class="btn btn-primary">Test button</button>

      <Dock />
    </div>
  )
}
