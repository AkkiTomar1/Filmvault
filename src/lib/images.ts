const IMAGE_BASE = 'https://image.tmdb.org/t/p/'

export function imageUrl(
  path: string | null | undefined,
  size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500',
): string | undefined {
  return path ? `${IMAGE_BASE}${size}${path}` : undefined
}

export function releaseYear(date: string | undefined | null): string {
  if (!date) return ''
  return date.slice(0, 4)
}

export function formatRating(value: number): string {
  return value.toFixed(1)
}