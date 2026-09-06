import { describe, expect, it } from 'vitest'
import { getPageNumbers } from './pagination'

describe('getPageNumbers', () => {
  it('returns a single page for total of 1', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
  })

  it('keeps every page when total is 7 or fewer', () => {
    expect(getPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows the first pages without a leading ellipsis on page 1', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 'ellipsis-end', 10])
  })

  it('hides early pages on page 10', () => {
    expect(getPageNumbers(10, 10)).toEqual([1, 'ellipsis-start', 8, 9, 10])
  })

  it('puts an ellipsis on both sides in the middle', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10])
  })

  it('clamps out-of-range pages', () => {
    expect(getPageNumbers(0, 10)).toEqual([1, 2, 3, 'ellipsis-end', 10])
    expect(getPageNumbers(99, 10)).toEqual([1, 'ellipsis-start', 8, 9, 10])
  })
})