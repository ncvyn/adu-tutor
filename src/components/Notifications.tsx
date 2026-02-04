import { For } from 'solid-js'
import { useNotifications } from '@/lib/notifications'

export const Notifications = () => {
  const { notifications, dismiss } = useNotifications()

  return (
    <div class="pointer-events-none toast toast-end toast-top z-50 gap-2">
      <For each={notifications()}>
        {(notification) => (
          <div
            class="pointer-events-auto alert alert-soft"
            classList={{
              'alert-success': notification.type === 'success',
              'alert-error': notification.type === 'error',
              'alert-warning': notification.type === 'warning',
              'alert-info': notification.type === 'info',
            }}
          >
            <span>{notification.message}</span>
            <button
              class="btn btn-ghost btn-sm"
              onClick={() => dismiss(notification.id)}
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  )
}
