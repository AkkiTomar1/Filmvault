import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import { getMoviesByGenre, getGenres } from '../api/tmdb'
import type { Genre, Movie } from '../types/tmdb'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'

export default function GenreMoviesPage() {
  const { id } = useParams()
  const genreId = Number(id)

  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  const [genres, setGenres] = useState<Genre[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getGenres(controller.signal)
      .then(setGenres)
      .catch((err) => {
        if (axios.isCancel(err)) return
        setGenres([])
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [genreId])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)

    getMoviesByGenre(genreId, page, controller.signal)
      .then((data) => {
        setMovies(data.results)
        setTotalPages(data.total_pages)
      })
      .catch((err) => {
        if (!axios.isCancel(err)) setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [genreId, page, reloadKey])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentGenre = genres.find((genre) => genre.id === genreId)

  return (
    <section className="p-3">
      <div className="flex flex-wrap justify-center gap-2 p-3">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/genre/${genre.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              genre.id === genreId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-white'
            }`}
          >
            {genre.name}
          </Link>
        ))}
      </div>

      <h2 className="p-2.5 text-center text-xl font-bold">
        {currentGenre ? `${currentGenre.name} Movies` : 'Movies'}
      </h2>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message="Couldn't load movies." onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <>
          <MovieGrid movies={movies} isInWatchlist={isInWatchlist} onToggle={toggle} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </section>
  )
}