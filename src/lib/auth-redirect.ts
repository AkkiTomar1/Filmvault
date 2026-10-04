export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string') return fallback
  if (!target.startsWith('/') || target.startsWith('//')) return fallback
  return target
}

export function redirectStateFrom(state: unknown): string | undefined {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' ? safeRedirect(from, '/') : undefined
}
