import { describe, expect, it } from 'vitest'
import { buildProviderUrl, normalizeProviderName } from '../lib/provider-links'

describe('normalizeProviderName', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeProviderName("Disney+ Plus!")).toBe('disneyplus')
  })
})

describe('buildProviderUrl', () => {
  it('builds a netflix search deeplink and url-encodes the title', () => {
    expect(buildProviderUrl('Netflix', 'Dune: Part Two')).toBe(
      'https://www.netflix.com/search?q=Dune%3A%20Part%20Two',
    )
  })

  it('maps every Amazon/Prime Video alias to Prime Video', () => {
    for (const name of ['Amazon Prime Video', 'Prime Video', 'Amazon Video']) {
      expect(buildProviderUrl(name, 'Arrival')).toBe(
        'https://www.primevideo.com/search?q=Arrival',
      )
    }
  })

  it('normalizes plus/space provider names like Disney+ and Paramount+', () => {
    expect(buildProviderUrl('Disney+', 'Encanto')).toBe(
      'https://www.disneyplus.com/search?q=Encanto',
    )
    expect(buildProviderUrl('Disney Plus', 'Encanto')).toBe(
      'https://www.disneyplus.com/search?q=Encanto',
    )
    expect(buildProviderUrl('Paramount+', 'Sonic')).toBe(
      'https://www.paramountplus.com/search?q=Sonic',
    )
    expect(buildProviderUrl('HBO Max', 'House')).toBe('https://www.max.com/search?q=House')
  })

  it('falls back to a substring match for names with an extra suffix', () => {
    expect(buildProviderUrl('Peacock Premium', 'Ted')).toBe(
      'https://www.peacocktv.com/search?q=Ted',
    )
    expect(buildProviderUrl('YouTube Premium', 'Any')).toBe(
      'https://www.youtube.com/results?search_query=Any',
    )
  })

  it('returns null for unknown providers', () => {
    expect(buildProviderUrl('Acme Stream', 'Whatever')).toBeNull()
  })

  it('returns null instead of crashing on malformed provider names', () => {
    expect(buildProviderUrl(undefined as never, 'Whatever')).toBeNull()
    expect(buildProviderUrl('Netflix', '')).toBeNull()
  })
})