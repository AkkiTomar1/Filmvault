import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectRegion } from './region'

describe('detectRegion', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_WATCHMODE_REGION', undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

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

  it('honors the VITE_WATCHMODE_REGION override regardless of locale', () => {
    vi.stubEnv('VITE_WATCHMODE_REGION', 'IN')
    expect(detectRegion('en-US')).toBe('IN')
  })

  it('normalizes the override to uppercase', () => {
    vi.stubEnv('VITE_WATCHMODE_REGION', ' ca ')
    expect(detectRegion('en-US')).toBe('CA')
  })

  it('ignores an invalid VITE_WATCHMODE_REGION override', () => {
    vi.stubEnv('VITE_WATCHMODE_REGION', 'usa')
    expect(detectRegion('en-US')).toBe('US')
  })
})