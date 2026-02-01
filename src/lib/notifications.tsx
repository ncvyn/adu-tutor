import { createContext, useContext, createSignal } from 'solid-js'
import { createUniqueId, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'

type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  type: NotificationType
  message: string
  timeout?: number
}

type NotificationsContextValue = {
  notifications: () => AppNotification[]
  notify: (notification: Omit<AppNotification, 'id'>) => string
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue>()

export function NotificationsProvider(props: { children: JSX.Element }) {
  const [notifications, setNotifications] = createSignal<AppNotification[]>([])

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
