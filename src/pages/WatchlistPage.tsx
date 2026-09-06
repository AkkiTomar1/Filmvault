import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlistContext } from '../context/WatchlistContext'
import { getGenres, genreName } from '../api/tmdb'
import type { Genre, Movie, SortKey } from '../types/tmdb'
import { imageUrl, releaseYear, formatRating } from '../lib/images'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'
import FallbackPoster from '../assets/Na.jpg'

type SortOption = { key: SortKey | 'none'; label: string }

const SORT_OPTIONS: SortOption[] = [
  { key: 'none', label: 'Sort by…' },
  { key: 'rating', label: 'Rating (high to low)' },
  { key: 'popularity', label: 'Popularity (high to low)' },
  { key: 'release', label: 'Release date (newest)' },
  { key: 'title', label: 'Title (A–Z)' },
]

const urlFor = (movie: Movie) => imageUrl(movie.backdrop_path, 'w300') ?? imageUrl(movie.poster_path, 'w300') ?? FallbackPoster

function sortMovies(movies: Movie[], sortKey: SortKey | 'none'): Movie[] {
  const sorted = [...movies]
  switch (sortKey) {
    case 'rating':
      return sorted.sort((a, b) => b.vote_average - a.vote_average)
    case 'popularity':
      return sorted.sort((a, b) => b.popularity - a.popularity)
    case 'release':
      return sorted.sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
      )
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return sorted
  }
}

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist, clearWatchlist } = useWatchlistContext()
  const { notify } = useToast()

  const [genres, setGenres] = useState<Genre[]>([])
  const [activeGenre, setActiveGenre] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | 'none'>('none')

  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => {
    const controller = new AbortController()
    getGenres(controller.signal)
      .then((list) => setGenres(Array.isArray(list) ? list : []))
      .catch(() => setGenres([]))
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    const matches = watchlist.filter((movie) => {
      const genreMatch = activeGenre === null || movie.genre_ids.includes(activeGenre)
      const searchHit = query === '' || movie.title.toLowerCase().includes(query)
      return genreMatch && searchHit
    })
    return sortMovies(matches, sortKey)
  }, [watchlist, activeGenre, debouncedSearch, sortKey])

  const handleRemove = (movie: Movie) => {
    removeFromWatchlist(movie.id)
    notify(`Removed "${movie.title}" from watchlist`, {
      actionLabel: 'Undo',
      onAction: () => addToWatchlist(movie),
    })
  }

  const handleClearAll = () => {
    const snapshot = watchlist
    clearWatchlist()
    notify('Watchlist cleared', {
      actionLabel: 'Undo',
      onAction: () => snapshot.forEach((movie) => addToWatchlist(movie)),
    })
  }

  if (watchlist.length === 0) {
    return (
      <section className="flex flex-col items-center gap-5 p-16 text-center">
        <span className="text-6xl" aria-hidden="true">
          🍿
        </span>
        <h2 className="text-2xl font-bold text-gray-800">Your watchlist is empty</h2>
        <p className="max-w-md text-gray-500">
          Browse trending movies, search for anything, and tap the heart on any card to save it
          here for later.
        </p>
        <Link
          to="/"
          className="rounded-full bg-blue-600 px-6 py-2.5 font-bold text-white transition hover:bg-blue-500"
        >
          Explore movies
        </Link>
      </section>
    )
  }

  return (
    <section className="p-4 sm:p-8">
      <h2 className="mb-4 text-center text-2xl font-bold">My Watchlist ({watchlist.length})</h2>

      {/* Genre filter pills */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveGenre(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            activeGenre === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-white'
          }`}
        >
          All Genres
        </button>
        {(genres ?? []).map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setActiveGenre(activeGenre === genre.id ? null : genre.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeGenre === genre.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-white'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* Search + sort + clear */}
      <div className="my-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your watchlist…"
          aria-label="Search watchlist"
          className="h-10 w-full max-w-xs rounded-full bg-gray-200 px-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey | 'none')}
          aria-label="Sort watchlist"
          className="h-10 rounded-full bg-gray-200 px-4 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleClearAll}
          className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 underline hover:text-red-600"
        >
          Clear all
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No movies match your filters.</p>
        ) : (
          <table className="w-full text-center text-gray-500" data-testid="watchlist-table">
            <thead className="border-b-1 bg-gray-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Ratings</th>
                <th className="px-4 py-3">Popularity</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((movie) => (
                <tr key={movie.id} className="border-b-2 align-middle">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-left">
                      <Link to={`/movie/${movie.id}`} aria-label={`View ${movie.title}`}>
                        <img
                          src={urlFor(movie)}
                          onError={(event) => {
                            event.currentTarget.src = FallbackPoster
                          }}
                          alt={movie.title}
                          loading="lazy"
                          className="h-16 w-24 rounded object-cover sm:h-24 sm:w-36"
                        />
                      </Link>
                      <div>
                        <Link to={`/movie/${movie.id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                          {movie.title}
                        </Link>
                        {releaseYear(movie.release_date) && (
                          <p className="text-sm text-gray-400">{releaseYear(movie.release_date)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{formatRating(movie.vote_average)}</td>
                  <td>{Math.round(movie.popularity).toLocaleString()}</td>
                  <td>
                    {(movie.genre_ids ?? [])
                      .map((genreId) => genreName(genres, genreId))
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemove(movie)}
                      className="text-red-800 underline hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}