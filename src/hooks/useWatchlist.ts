import { useCallback, useEffect, useState } from 'react'
import type { Movie } from '../types/tmdb'

const STORAGE_KEY = 'filmvault.watchlist'

function loadWatchlist(): Movie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Movie[]) : []
  } catch {
    return []
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>(loadWatchlist)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
    } catch {
      // storage unavailable (private mode / quota) — keep in-memory state
    }
  }, [watchlist])

  const isInWatchlist = useCallback(
    (movieId: number) => watchlist.some((movie) => movie.id === movieId),
    [watchlist],
  )

  const addToWatchlist = useCallback((movie: Movie) => {
    setWatchlist((prev) =>
      prev.some((existing) => existing.id === movie.id) ? prev : [...prev, movie],
    )
  }, [])

  const removeFromWatchlist = useCallback((movieId: number) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== movieId))
  }, [])

  const clearWatchlist = useCallback(() => setWatchlist([]), [])

  return {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
  }
}