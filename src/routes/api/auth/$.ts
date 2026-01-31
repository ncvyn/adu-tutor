import { createFileRoute } from '@tanstack/solid-router'
import { auth } from '@/lib/auth'

async function handle(request: Request) {
  let parsedBody: any = undefined
  try {
    parsedBody = await request.clone().json()
    console.log('Incoming auth request body:', parsedBody)
  } catch (e) {
    console.log('No JSON body or invalid JSON:', e)
  }

  try {
    return await auth.handler(request)
  } catch (err) {
    console.error('auth.handler error', err)
    const body = {
      message: (err && (err as any).message) || 'Unknown error',
      code: (err && (err as any).code) || undefined,
      validation: (err && (err as any).validation) || undefined,
      receivedBody: typeof parsedBody !== 'undefined' ? parsedBody : 'no-json',
      // include stack only for debugging; remove in production
      stack: (err && (err as any).stack) || undefined,
    }
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handle(request),
      POST: async ({ request }: { request: Request }) => handle(request),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,POST,OPTIONS',
            'access-control-allow-headers': 'Content-Type, Authorization',
          },
        }),
    },
  },
})
