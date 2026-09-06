import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPlay, FaFire, FaStar, FaHeart, FaRegHeart } from 'react-icons/fa6'
import { getTrending, getGenres, genreName } from '../api/tmdb'
import type { Genre, Movie } from '../types/tmdb'
import { imageUrl, releaseYear, formatRating } from '../lib/images'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'
import FallbackPoster from '../assets/Na.jpg'

export default function Banner() {
  const [featured, setFeatured] = useState<Movie | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  useEffect(() => {
    const controller = new AbortController()
    getTrending(1, controller.signal)
      .then((data) => setFeatured(data.results[0] ?? null))
      .catch(() => setFeatured(null))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let cancelled = false
    getGenres()
      .then((list) => {
        if (!cancelled) setGenres(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setGenres([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const backdrop = imageUrl(featured?.backdrop_path, 'w1280')
  const poster = featured
    ? (imageUrl(featured.poster_path, 'w500') ?? FallbackPoster)
    : FallbackPoster
  const title = featured?.title ?? 'Filmvault'
  const inWatchlist = featured ? isInWatchlist(featured.id) : false
  const chips = featured ? featured.genre_ids.slice(0, 3).map((id) => genreName(genres, id)) : []
  const language = featured?.original_language?.toUpperCase()

  return (
    <section
      className="relative flex h-[30vh] items-end justify-center overflow-hidden bg-gray-900 md:h-[70vh]"
      aria-label="Featured movie"
    >
      {/* Backdrop */}
      <div
        className="banner-kenburns absolute inset-0 bg-cover bg-center"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      />

      {/* Film grain */}
      <div className="banner-grain absolute inset-0 opacity-50 mix-blend-overlay" aria-hidden="true" />

      {/* Vignettes */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-gray-900 via-gray-900/45 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-gray-950/60 via-transparent to-gray-950/30"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gray-950/50 to-transparent" />

      {/* Fallback brand glow */}
      {!featured && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            src={FallbackPoster}
            alt=""
            className="w-40 rounded-full opacity-20 blur-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col gap-4 px-4 pb-6 sm:px-6 md:pb-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="max-w-2xl text-center lg:text-left">
          {featured && (
            <>
              {/* Trending badge */}
              <p className="animate-fade-up flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-400 drop-shadow lg:justify-start">
                <FaFire aria-hidden="true" />
                Trending · #1 This Week
              </p>

              <h1
                className="animate-fade-up mt-2 text-2xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] md:text-4xl"
                style={{ animationDelay: '150ms' }}
                data-testid="banner-title"
              >
                {title}
              </h1>

              {/* Meta row */}
              <div
                className="animate-fade-up mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-200 lg:justify-start"
                style={{ animationDelay: '300ms' }}
              >
                <span className="flex items-center gap-1.5 font-semibold text-yellow-400">
                  <FaStar aria-hidden="true" />
                  {formatRating(featured.vote_average)}
                </span>
                {releaseYear(featured.release_date) && (
                  <span className="font-medium text-gray-300">{releaseYear(featured.release_date)}</span>
                )}
                {language && (
                  <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs font-bold uppercase">
                    {language}
                  </span>
                )}
              </div>

              {/* Overview */}
              <p
                className="animate-fade-up mt-3 hidden max-w-xl text-sm leading-relaxed text-gray-200/90 md:block"
                style={{ animationDelay: '400ms' }}
              >
                {featured.overview}
              </p>

              {/* Genre chips */}
              {chips.some(Boolean) && (
                <div
                  className="animate-fade-up mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
                  style={{ animationDelay: '450ms' }}
                >
                  {chips.map((chip) =>
                    chip ? (
                      <span
                        key={chip}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                      >
                        {chip}
                      </span>
                    ) : null,
                  )}
                </div>
              )}

              {/* Actions */}
              <div
                className="animate-fade-up mt-5 flex items-center justify-center gap-3 lg:justify-start"
                style={{ animationDelay: '600ms' }}
              >
                <Link
                  to={`/movie/${featured.id}`}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-red-900/40 transition hover:scale-105 hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <FaPlay aria-hidden="true" /> View Details
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(featured)}
                  aria-label={inWatchlist ? `Remove ${featured.title} from watchlist` : `Add ${featured.title} to watchlist`}
                  aria-pressed={inWatchlist}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-white ${
                    inWatchlist
                      ? 'border-red-400/60 bg-red-600 text-white shadow-lg shadow-red-900/40'
                      : 'border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20'
                  }`}
                >
                  {inWatchlist ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
                </button>
              </div>
            </>
          )}

          {!featured && (
            <h1 className="text-2xl font-bold text-white md:text-4xl" data-testid="banner-title">
              Welcome to Filmvault
            </h1>
          )}
        </div>

        {/* Floating poster card */}
        {featured && (
          <div className="hidden shrink-0 lg:block" aria-hidden="true">
            <img
              src={poster}
              onError={(event) => (event.currentTarget.src = FallbackPoster)}
              alt=""
              className="w-40 rotate-3 rounded-2xl border border-white/15 shadow-2xl shadow-blue-950/50 transition duration-300 hover:rotate-0 hover:scale-105 xl:w-48"
            />
          </div>
        )}
      </div>
    </section>
  )
}