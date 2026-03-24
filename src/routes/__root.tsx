import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { QueryClientProvider } from '@tanstack/solid-query'
import { ErrorBoundary, onMount } from 'solid-js'
import { HydrationScript } from 'solid-js/web'

import {
  Notifications,
  NotificationsProvider,
} from '@/components/Notifications'
import { ChatProvider } from '@/components/messages/ChatContext'
import { BadgeWatcher } from '@/components/BadgeWatcher'
import { queryClient } from '@/lib/query-client'
import { initTheme } from '@/lib/theme'

import styleCss from '@/styles.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    meta: [
      {
        charset: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: 'AdU-Tutor',
      },
    ],
  }),
  shellComponent: RootComponent,
})

function RootErrorFallback() {
  return (
    <div class="m-4 rounded-box border border-error/30 bg-error/10 p-4 text-error">
      <p class="font-semibold">Something went wrong.</p>
      <a class="btn mt-3 btn-sm btn-error" href="/">
        Go home
      </a>
    </div>
  )
}

function RootComponent() {
  onMount(initTheme)

  return (
    <html>
      <head>
        <HydrationScript />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <NotificationsProvider>
            <ChatProvider>
              <HeadContent />
              <ErrorBoundary fallback={<RootErrorFallback />}>
                <Notifications />
                <BadgeWatcher />
                <Outlet />
                {process.env.NODE_ENV === 'development' && (
                  <TanStackRouterDevtools />
                )}
              </ErrorBoundary>
              <Scripts />
            </ChatProvider>
          </NotificationsProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
