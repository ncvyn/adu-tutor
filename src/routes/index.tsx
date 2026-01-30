import { createFileRoute } from '@tanstack/solid-router'
import { HomePage, LandingPage } from '@/pages'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div class="min-h-screen">
      <LandingPage />
    </div>
  )
}
