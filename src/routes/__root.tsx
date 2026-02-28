import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import {
  Notifications,
  NotificationsProvider,
} from '@/components/Notifications'

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

function RootComponent() {
  return (
    <html>
      <head>
        <HydrationScript />
      </head>
      <body>
        <NotificationsProvider>
          <HeadContent />
          <Suspense>
            <Notifications />
            <Outlet />
            {process.env.NODE_ENV === 'development' && (
              <TanStackRouterDevtools />
            )}
          </Suspense>
          <Scripts />
        </NotificationsProvider>
      </body>
    </html>
  )
}
