export const unixToLocale = (timestamp: number) => {
  const ts = new Date(timestamp)

  const date =
    ts.toDateString() === new Date().toDateString()
      ? 'Today'
      : ts.toLocaleDateString([], {
          month: 'short',
          day: '2-digit',
        })
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${date}, ${time}`
}
