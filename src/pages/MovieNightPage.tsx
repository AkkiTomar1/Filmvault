import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaShuffle, FaDice, FaRotateLeft, FaFilm } from 'react-icons/fa6'
import { getDiscoverMovies, getGenres, getRandomMovie } from '../api/tmdb'
import type { Genre, Movie } from '../types/tmdb'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useWatchlistToggle } from '../hooks/useWatchlistToggle'
import MovieGrid from '../components/MovieGrid'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'

const PICK_COUNT = 5
const MIN_VOTES = 200

interface EraOption {
  key: string
  label: string
  range?: [string, string]
}

interface RuntimeOption {
  key: string
  label: string
  minutes?: number
}

const ERAS: EraOption[] = [
  { key: 'any', label: 'Any Era' },
  { key: '1980s', label: "80's", range: ['1980-01-01', '1989-12-31'] },
  { key: '1990s', label: "90's", range: ['1990-01-01', '1999-12-31'] },
  { key: '2000s', label: "00's", range: ['2000-01-01', '2009-12-31'] },
  { key: '2010s', label: "'10s", range: ['2010-01-01', '2019-12-31'] },
  { key: '2020s', label: "'20s", range: ['2020-01-01', '2029-12-31'] },
]

const RUNTIMES: RuntimeOption[] = [
  { key: 'any', label: 'Any length' },
  { key: '90', label: 'Under 90 min', minutes: 90 },
  { key: '120', label: 'Under 2 hrs', minutes: 120 },
  { key: '150', label: 'Under 2.5 hrs', minutes: 150 },
]

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-xs text-white">
        {step}
      </span>
      {title}
    </h3>
  )
}

const chipClass = (active: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-blue-400 ${
    active
      ? 'border-blue-400/60 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
      : 'border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 hover:text-black'
  }`

export default function MovieNightPage() {
  const navigate = useNavigate()
  const { isInWatchlist } = useWatchlistContext()
  const toggle = useWatchlistToggle()

  const [availableGenres, setAvailableGenres] = useState<Genre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [eraKey, setEraKey] = useState('any')
  const [runtimeKey, setRuntimeKey] = useState('any')

  const [pool, setPool] = useState<Movie[]>([])
  const [picks, setPicks] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [pickingRandom, setPickingRandom] = useState(false)

  useEffect(() => {
    let cancelled = false
    getGenres()
      .then((list) => {
        if (!cancelled) setAvailableGenres(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setAvailableGenres([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleGenre = (id: number) => {
    setSelectedGenres((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]))
  }

  const generate = () => {
    const era = ERAS.find((option) => option.key === eraKey)
    const runtime = RUNTIMES.find((option) => option.key === runtimeKey)
    setLoading(true)
    setError(false)
    getDiscoverMovies({
      genres: selectedGenres,
      releaseFrom: era?.range?.[0],
      releaseTo: era?.range?.[1],
      maxRuntime: runtime?.minutes,
      minVotes: MIN_VOTES,
      page: 1,
    })
      .then((data) => {
        const results = data.results ?? []
        setPool(results)
        setPicks(shuffle(results).slice(0, PICK_COUNT))
        setGenerated(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const shuffleAgain = () => {
    setPicks(shuffle(pool).slice(0, PICK_COUNT))
  }

  const startOver = () => {
    setSelectedGenres([])
    setEraKey('any')
    setRuntimeKey('any')
    setPool([])
    setPicks([])
    setGenerated(false)
    setError(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const surpriseMe = async () => {
    if (pickingRandom) return
    setPickingRandom(true)
    try {
      const movie = await getRandomMovie()
      navigate(`/movie/${movie.id}`)
    } catch {
      setPickingRandom(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white px-6 pb-5 pt-10 text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
          <FaFilm aria-hidden="true" /> No plans tonight?
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
          Movie Night{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Generator
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-700">
          Pick a mood, an era, and a length — we'll serve up five great options.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-black/25 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <StepHeading step={1} title="Mood" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGenres([])}
                  className={chipClass(selectedGenres.length === 0)}
                >
                  Any mood
                </button>
                {availableGenres.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    aria-pressed={selectedGenres.includes(genre.id)}
                    className={chipClass(selectedGenres.includes(genre.id))}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <StepHeading step={2} title="Era" />
              <div className="flex flex-wrap gap-2">
                {ERAS.map((era) => (
                  <button
                    key={era.key}
                    type="button"
                    onClick={() => setEraKey(era.key)}
                    aria-pressed={eraKey === era.key}
                    className={chipClass(eraKey === era.key)}
                  >
                    {era.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <StepHeading step={3} title="Runtime" />
              <div className="flex flex-wrap gap-2">
                {RUNTIMES.map((runtime) => (
                  <button
                    key={runtime.key}
                    type="button"
                    onClick={() => setRuntimeKey(runtime.key)}
                    aria-pressed={runtimeKey === runtime.key}
                    className={chipClass(runtimeKey === runtime.key)}
                  >
                    {runtime.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-900/40 transition hover:scale-105 hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate Picks'}
            </button>
            <button
              type="button"
              onClick={surpriseMe}
              disabled={pickingRandom}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 font-bold text-gray-900 transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60"
            >
              <FaDice className={pickingRandom ? 'animate-spin text-blue-600' : 'text-blue-600'} aria-hidden="true" />
              {pickingRandom ? 'Rolling…' : 'Surprise Me'}
            </button>
            {generated && (
              <button
                type="button"
                onClick={startOver}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <FaRotateLeft aria-hidden="true" /> Start Over
              </button>
            )}
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <LoadingSkeleton count={PICK_COUNT} />
          ) : error ? (
            <ErrorState message="Couldn't generate picks." onRetry={generate} />
          ) : generated && picks.length > 0 ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-white">Tonight's Picks</h2>
                <button
                  type="button"
                  onClick={shuffleAgain}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <FaShuffle aria-hidden="true" /> Shuffle Again
                </button>
              </div>
              <MovieGrid movies={picks} isInWatchlist={isInWatchlist} onToggle={toggle} />
            </>
          ) : generated ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
              No movies match those filters. Loosen the mood or era and try again.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}