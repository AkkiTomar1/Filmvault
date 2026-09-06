import type { LoaderFunctionArgs } from 'react-router-dom'
import { Link, useLoaderData } from 'react-router-dom'
import { FaHeart, FaRegHeart, FaPlay, FaStar } from 'react-icons/fa6'
import MovieGrid from '../components/MovieGrid'
import { getMovieCredits, getMovieDetails, getMovieVideos, getSimilarMovies } from '../api/tmdb'
import type { CastMember, Movie, MovieDetails, Video } from '../types/tmdb'
import { imageUrl, releaseYear, formatRating } from '../lib/images'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'
import FallbackPoster from '../assets/Na.jpg'

export interface MovieDetailsLoaderData {
  details: MovieDetails
  videos: Video[]
  cast: CastMember[]
  similar: Movie[]
}

export async function loader({ params }: LoaderFunctionArgs): Promise<MovieDetailsLoaderData> {
  const movieId = Number(params.id)
  if (!Number.isFinite(movieId)) {
    throw new Response('Movie not found', { status: 404 })
  }

  const [details, videos, credits, similar] = await Promise.all([
    getMovieDetails(movieId),
    getMovieVideos(movieId),
    getMovieCredits(movieId),
    getSimilarMovies(movieId),
  ])

  return {
    details,
    videos: videos.results,
    cast: credits.cast,
    similar: similar.results,
  }
}

function minutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function MovieCast({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-xl font-bold">Cast</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[...cast].sort((a, b) => a.order - b.order).slice(0, 10).map((person) => (
          <div key={person.id} className="w-28 shrink-0 text-center">
            <img
              src={imageUrl(person.profile_path, 'w300') ?? FallbackPoster}
              onError={(event) => {
                event.currentTarget.src = FallbackPoster
              }}
              alt={person.name}
              loading="lazy"
              className="mx-auto h-28 w-28 rounded-full bg-gray-200 object-cover"
            />
            <p className="mt-2 text-sm font-semibold text-gray-800">{person.name}</p>
            <p className="text-xs text-gray-500">{person.character}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function MovieDetailsPage() {
  const { details, videos, cast, similar } = useLoaderData() as MovieDetailsLoaderData

  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  const inWatchlist = isInWatchlist(details.id)
  const backdrop = imageUrl(details.backdrop_path, 'w1280')
  const ratingPercent = (details.vote_average / 10) * 100
  const trailer = videos.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer',
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <section
        className="relative flex min-h-[45vh] items-end bg-gray-900 bg-cover bg-center md:min-h-[65vh]"
        style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-gray-900/70 to-gray-900/30" />
        <div className="relative z-10 flex w-full flex-col gap-4 px-6 pb-8 pt-16 md:px-12">
          <div className="flex flex-wrap items-start gap-6">
            <img
              src={imageUrl(details.poster_path, 'w500') ?? FallbackPoster}
              onError={(event) => {
                event.currentTarget.src = FallbackPoster
              }}
              alt={`${details.title} poster`}
              className="hidden h-72 w-48 rounded-xl object-cover shadow-xl sm:block"
            />
            <div className="max-w-2xl flex-1">
              <h1 className="text-3xl font-bold text-white md:text-5xl">{details.title}</h1>
              {details.tagline && (
                <p className="mt-1 text-lg italic text-gray-200">{details.tagline}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {details.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to={`/genre/${genre.id}`}
                    className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1 text-yellow-400">
                  <FaStar aria-hidden="true" />
                  <span className="font-bold text-white">{formatRating(details.vote_average)}</span>
                </span>
                <span aria-label={`${ratingPercent.toFixed(0)} percent rating`}>
                  {releaseYear(details.release_date) || '—'}
                </span>
                {details.runtime !== null && details.runtime > 0 && (
                  <span>{minutesToHours(details.runtime)}</span>
                )}
                <span className="capitalize">{details.status}</span>
              </div>

              <div className="mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${ratingPercent}%` }}
                  data-testid="rating-bar"
                />
              </div>

              <button
                type="button"
                onClick={() => toggle(details)}
                className="mt-4 flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 font-bold text-white transition hover:bg-red-500"
                data-testid="details-toggle"
              >
                {inWatchlist ? <FaHeart /> : <FaRegHeart />}
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {details.overview && (
          <section>
            <h3 className="mb-2 text-xl font-bold">Overview</h3>
            <p className="leading-relaxed text-gray-700">{details.overview}</p>
          </section>
        )}

        {trailer && (
          <section className="mt-8">
            <h3 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <FaPlay className="text-red-600" /> Trailer
            </h3>
            <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </section>
        )}

        <MovieCast cast={cast} />

        {similar.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 text-xl font-bold">Similar Movies</h3>
            <MovieGrid
              movies={similar.slice(0, 6)}
              isInWatchlist={isInWatchlist}
              onToggle={toggle}
            />
          </section>
        )}
      </div>
    </div>
  )
}