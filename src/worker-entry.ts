// Re-export the default TanStack Start server handler
export { default } from '@tanstack/solid-start/server-entry'

// Re-export the Durable Object class so Cloudflare can find it
export { ChatRoom } from '@/lib/chat-room'
