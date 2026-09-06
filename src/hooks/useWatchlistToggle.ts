import { useCallback } from 'react'
import type { Movie } from '../types/tmdb'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useToast } from '../context/ToastContext'

export function useWatchlistToggle() {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistContext()
  const { notify } = useToast()

  return useCallback(
    (movie: Movie) => {
      if (isInWatchlist(movie.id)) {
        removeFromWatchlist(movie.id)
        notify(`Removed "${movie.title}" from watchlist`, {
          actionLabel: 'Undo',
          onAction: () => addToWatchlist(movie),
        })
      } else {
        addToWatchlist(movie)
        notify(`Added "${movie.title}" to watchlist`, {
          actionLabel: 'Undo',
          onAction: () => removeFromWatchlist(movie.id),
        })
      }
    },
    [isInWatchlist, addToWatchlist, removeFromWatchlist, notify],
  )
}