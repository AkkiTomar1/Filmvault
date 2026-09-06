import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useWatchlist } from './useWatchlist'
import type { Movie } from '../types/tmdb'

const makeMovie = (id: number, title = `Movie ${id}`): Movie => ({
  id,
  title,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7.5,
  vote_count: 10,
  popularity: 100,
  genre_ids: [28],
  adult: false,
  original_language: 'en',
})

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual([])
  })

  it('adds movies without duplicates and removes them', () => {
    const { result } = renderHook(() => useWatchlist())

    act(() => result.current.addToWatchlist(makeMovie(1)))
    act(() => result.current.addToWatchlist(makeMovie(1)))

    expect(result.current.watchlist).toHaveLength(1)
    expect(result.current.isInWatchlist(1)).toBe(true)

    act(() => result.current.removeFromWatchlist(1))

    expect(result.current.watchlist).toHaveLength(0)
    expect(result.current.isInWatchlist(1)).toBe(false)
  })

  it('persists to localStorage and hydrates on next load', async () => {
    const first = renderHook(() => useWatchlist())
    act(() => first.result.current.addToWatchlist(makeMovie(1)))

    await waitFor(() => {
      expect(localStorage.getItem('filmvault.watchlist')).toContain('Movie 1')
    })

    const second = renderHook(() => useWatchlist())
    expect(second.result.current.watchlist.map((movie) => movie.id)).toEqual([1])
  })

  it('ignores corrupt localStorage data', () => {
    localStorage.setItem('filmvault.watchlist', 'not-json')

    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual([])
  })
})