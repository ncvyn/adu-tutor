import {
  createContext,
  createSignal,
  createUniqueId,
  onCleanup,
  useContext,
  For,
  type JSX,
} from 'solid-js'

type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  type: NotificationType
  message: string
  timeout?: number
}

type NotificationsContextValue = {
  notifications: () => Array<AppNotification>
  notify: (notification: Omit<AppNotification, 'id'>) => string
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue>()

export function NotificationsProvider(props: { children: JSX.Element }) {
  const [notifications, setNotifications] = createSignal<
    Array<AppNotification>
  >([])

  const dismiss = (id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  const notify: NotificationsContextValue['notify'] = ({
    type,
    message,
    timeout = 5000,
  }) => {
    const id = createUniqueId()
    setNotifications((current) => [...current, { id, type, message, timeout }])

    // auto-dismiss after the timeout
    const timer = setTimeout(() => dismiss(id), timeout)
    onCleanup(() => clearTimeout(timer))

    return id
  }

  return (
    <NotificationsContext.Provider value={{ notifications, notify, dismiss }}>
      {props.children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider',
    )
  }
  return ctx
}

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
