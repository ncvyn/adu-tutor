export function getConversationPair(s: string, r: string) {
  return s.localeCompare(r) <= 0
    ? { minUserId: s, maxUserId: r }
    : { minUserId: r, maxUserId: s }
}
