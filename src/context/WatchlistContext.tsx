import { createContext, useMemo, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Movie } from '../types/tmdb'
import { useWatchlist } from '../hooks/useWatchlist'

interface WatchlistContextValue {
  watchlist: Movie[]
  isInWatchlist: (movieId: number) => boolean
  addToWatchlist: (movie: Movie) => void
  removeFromWatchlist: (movieId: number) => void
  clearWatchlist: () => void
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined)

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const watchlistState = useWatchlist()

  const value = useMemo(() => watchlistState, [watchlistState])

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext)
  if (!ctx) {
    throw new Error('useWatchlistContext must be used within a WatchlistProvider')
  }
  return ctx
}