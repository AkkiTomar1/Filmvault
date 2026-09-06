import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPlay } from 'react-icons/fa6'
import { getTrending } from '../api/tmdb'
import type { Movie } from '../types/tmdb'
import { imageUrl } from '../lib/images'

export default function Banner() {
  const [featured, setFeatured] = useState<Movie | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getTrending(1, controller.signal)
      .then((data) => setFeatured(data.results[0] ?? null))
      .catch(() => setFeatured(null))
    return () => controller.abort()
  }, [])

  const backdrop = imageUrl(featured?.backdrop_path, 'w1280')
  const name = featured?.title ?? 'Filmvault'

  return (
    <section
      className="relative flex h-[30vh] items-end justify-center bg-gray-900 bg-cover bg-center md:h-[70vh]"
      style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
      aria-label="Featured movie"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 pb-6 text-center">
        <h1
          className="px-4 text-xl font-bold text-white drop-shadow md:text-4xl"
          data-testid="banner-title"
        >
          {featured ? name : 'Welcome to Filmvault'}
        </h1>
        {featured && (
          <>
            <p className="hidden max-w-2xl px-4 text-sm text-gray-200 md:block">
              {featured.overview}
            </p>
            <Link
              to={`/movie/${featured.id}`}
              className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 font-bold text-white transition hover:bg-red-500"
            >
              <FaPlay /> View Details
            </Link>
          </>
        )}
      </div>
    </section>
  )
}