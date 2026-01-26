import { createFileRoute } from '@tanstack/solid-router'
// lucide-solid

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div class="min-h-screen">
      <p>Welcome to AdU-Tutor</p>
      <button class="btn btn-primary">Test button</button>
    </div>
  )
}
