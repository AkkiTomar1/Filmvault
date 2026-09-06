import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaStar } from 'react-icons/fa6'
import type { Movie } from '../types/tmdb'
import { imageUrl, releaseYear, formatRating } from '../lib/images'
import FallbackPoster from '../assets/Na.jpg'

interface MovieCardProps {
  movie: Movie
  isInWatchlist: boolean
  onToggle: () => void
}

export default function MovieCard({ movie, isInWatchlist, onToggle }: MovieCardProps) {
  const [imgError, setImgError] = useState(false)

  const poster = imgError ? FallbackPoster : (imageUrl(movie.poster_path, 'w300') ?? FallbackPoster)

  return (
    <div className="group relative w-[160px] sm:w-[189px]">
      <Link
        to={`/movie/${movie.id}`}
        className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <img
          src={poster}
          onError={() => setImgError(true)}
          alt={movie.title}
          loading="lazy"
          className="h-[42vh] w-full bg-gray-800 object-cover transition-transform duration-200 group-hover:scale-105 sm:h-[48vh]"
        />

        <div className="absolute bottom-0 w-full rounded-b-xl bg-gray-900/70 px-2 py-1.5 text-center text-sm font-medium text-white">
          {movie.title}
          {releaseYear(movie.release_date) && (
            <span className="text-xs text-gray-300"> ({releaseYear(movie.release_date)})</span>
          )}
        </div>

        <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-sm text-yellow-400">
          <FaStar aria-hidden="true" />
          <span data-testid="rating">{formatRating(movie.vote_average)}</span>
        </div>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-label={isInWatchlist ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
        aria-pressed={isInWatchlist}
        className="absolute right-2 top-2 rounded-full bg-gray-900/70 p-2 text-white transition hover:scale-110 hover:bg-gray-900/90 focus-visible:ring-2 focus-visible:ring-blue-500"
        data-testid="toggle-watchlist"
      >
        {isInWatchlist ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
      </button>
    </div>
  )
}