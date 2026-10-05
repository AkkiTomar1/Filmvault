import { useCallback, useEffect, useRef, useState } from 'react'
import type { Movie } from '../types/tmdb'
import {
  apiGetWatchlist,
  apiAddToWatchlist,
  apiRemoveFromWatchlist,
  apiSyncWatchlist,
} from '../api/backend'

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

export function useWatchlist(token?: string | null) {
  const [watchlist, setWatchlist] = useState<Movie[]>(loadWatchlist)
  const prevTokenRef = useRef<string | null | undefined>(token)

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
    } catch {
      // storage unavailable (private mode / quota)
    }
  }, [watchlist])

  // When user logs in or token is available: sync local watchlist with MongoDB database
  useEffect(() => {
    if (!token) {
      prevTokenRef.current = token
      return
    }

    let isMounted = true

    async function syncWithDatabase(authToken: string) {
      try {
        const localMovies = loadWatchlist()
        // If there are local movies, sync them up with MongoDB
        if (localMovies.length > 0) {
          const res = await apiSyncWatchlist(authToken, localMovies)
          if (isMounted && res.success && Array.isArray(res.watchlist)) {
            setWatchlist(res.watchlist)
            return
          }
        }

        // Otherwise fetch from database
        const res = await apiGetWatchlist(authToken)
        if (isMounted && res.success && Array.isArray(res.watchlist)) {
          setWatchlist(res.watchlist)
        }
      } catch (err) {
        console.warn('Watchlist database sync error, falling back to local cache:', err)
      }
    }

    syncWithDatabase(token)
    prevTokenRef.current = token

    return () => {
      isMounted = false
    }
  }, [token])

  const isInWatchlist = useCallback(
    (movieId: number) => watchlist.some((movie) => movie.id === movieId),
    [watchlist],
  )

  const addToWatchlist = useCallback(
    (movie: Movie) => {
      setWatchlist((prev) =>
        prev.some((existing) => existing.id === movie.id) ? prev : [...prev, movie],
      )

      if (token) {
        apiAddToWatchlist(token, movie).catch((err) => {
          console.warn('Failed to persist added movie to database:', err)
        })
      }
    },
    [token],
  )

  const removeFromWatchlist = useCallback(
    (movieId: number) => {
      setWatchlist((prev) => prev.filter((movie) => movie.id !== movieId))

      if (token) {
        apiRemoveFromWatchlist(token, movieId).catch((err) => {
          console.warn('Failed to remove movie from database:', err)
        })
      }
    },
    [token],
  )

  const clearWatchlist = useCallback(() => {
    setWatchlist([])
  }, [])

  return {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
  }
}