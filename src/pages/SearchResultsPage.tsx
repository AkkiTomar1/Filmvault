import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import { searchMovies } from '../api/tmdb'
import type { Movie } from '../types/tmdb'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'
import { useDebounce } from '../hooks/useDebounce'

export default function SearchResultsPage() {
  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [input, setInput] = useState(urlQuery)
  const debouncedQuery = useDebounce(input, 400)

  const [movies, setMovies] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true })
  }, [debouncedQuery, setSearchParams])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  useEffect(() => {
    if (!debouncedQuery) {
      setMovies([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    searchMovies(debouncedQuery, page, controller.signal)
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
  }, [debouncedQuery, page, reloadKey])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="p-3">
      <div className="flex justify-center py-4">
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search movies…"
          aria-label="Search movies"
          autoFocus
          className="h-11 w-full max-w-md rounded-full bg-gray-200 px-5 outline-none ring-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {!debouncedQuery ? (
        <p className="py-10 text-center text-gray-500">Start typing to search the TMDB catalog.</p>
      ) : (
        <>
          <h2 className="p-2.5 text-center text-xl font-bold">
            Results for &ldquo;{debouncedQuery}&rdquo;
          </h2>

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState
              message="Search failed."
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          ) : movies.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No movies found for &ldquo;{debouncedQuery}&rdquo;.
            </p>
          ) : (
            <>
              <MovieGrid movies={movies} isInWatchlist={isInWatchlist} onToggle={toggle} />
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </>
      )}
    </section>
  )
}