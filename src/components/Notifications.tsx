import { For } from 'solid-js'
import { useNotifications } from '@/lib/notifications'

export const Notifications = () => {
  const { notifications, dismiss } = useNotifications()

  return (
    <div class="toast toast-end toast-top z-50 pointer-events-none gap-2">
      <For each={notifications()}>
        {(notification) => (
          <div
            class="alert pointer-events-auto"
            classList={{
              'alert-success': notification.type === 'success',
              'alert-error': notification.type === 'error',
              'alert-warning': notification.type === 'warning',
              'alert-info': notification.type === 'info',
            }}
          >
            <span>{notification.message}</span>
            <button
              class="btn btn-sm btn-ghost"
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
