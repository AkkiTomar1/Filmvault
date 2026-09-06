import { useEffect, useState } from 'react'
import axios from 'axios'
import Banner from '../components/Banner'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import { getPopularMovies } from '../api/tmdb'
import type { Movie } from '../types/tmdb'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'

export default function HomePage() {
  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  const [movies, setMovies] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)

    getPopularMovies(page, controller.signal)
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
  }, [page, reloadKey])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Banner />
      <section className="p-3">
        <h2 className="p-2.5 text-center text-xl font-bold">Trending Movies</h2>

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
    </>
  )
}