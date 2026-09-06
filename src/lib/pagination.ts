export type PageNumber = number | 'ellipsis-start' | 'ellipsis-end'

export function getPageNumbers(current: number, total: number): PageNumber[] {
  const size = Math.max(1, total)
  if (current < 1) current = 1
  if (current > size) current = size

  if (size <= 7) {
    return Array.from({ length: size }, (_, index) => index + 1)
  }

  const pages: PageNumber[] = [1]
  let start = current - 1
  let end = current + 1
  if (start < 2) {
    end = Math.min(size - 1, start + 3)
    start = 2
  }
  if (end > size - 1) {
    start = Math.max(2, end - 3)
    end = size - 1
  }

  if (start > 2) pages.push('ellipsis-start')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < size - 1) pages.push('ellipsis-end')
  pages.push(size)

  return pages
}