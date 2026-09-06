import { describe, expect, it } from 'vitest'
import { detectRegion } from './region'

describe('detectRegion', () => {
  it('extracts the two-letter region from a BCP-47 tag', () => {
    expect(detectRegion('en-US')).toBe('US')
    expect(detectRegion('en-IN')).toBe('IN')
    expect(detectRegion('pt-BR')).toBe('BR')
    expect(detectRegion('zh-Hant-TW')).toBe('TW')
  })

  it('falls back to US when there is no region', () => {
    expect(detectRegion('en')).toBe('US')
    expect(detectRegion('es')).toBe('US')
  })

  it('handles empty input', () => {
    expect(detectRegion('')).toBe('US')
  })
})