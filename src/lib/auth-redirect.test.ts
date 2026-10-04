import { safeRedirect, redirectStateFrom } from './auth-redirect'

describe('auth-redirect', () => {
  it('blocks external', () => {
    expect(safeRedirect('//evil.com')).toBe('/')
    expect(safeRedirect('https://evil.com')).toBe('/')
  })
  it('allows internal', () => {
    expect(safeRedirect('/profile')).toBe('/profile')
  })
  it('extracts from state', () => {
    expect(redirectStateFrom({ from: '/watchlist' })).toBe('/watchlist')
    expect(redirectStateFrom(null)).toBeUndefined()
  })
})
