import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FaMagnifyingGlass,
  FaChevronDown,
  FaFilm,
  FaClapperboard,
  FaDice,
  FaUser,
  FaArrowRightFromBracket,
  FaHeart,
} from 'react-icons/fa6'
import Logo from '../assets/Na.jpg'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useAuth } from '../context/AuthContext'
import { getAvatarPreset } from '../lib/avatars'
import { getGenres, searchMovies, getRandomMovie } from '../api/tmdb'
import type { Genre, Movie } from '../types/tmdb'
import { imageUrl, releaseYear } from '../lib/images'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-blue-400 ${
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
      : 'text-blue-300 hover:bg-white/10 hover:text-white'
  }`

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 6

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { watchlist } = useWatchlistContext()
  const { user, isAuthenticated, logout, openAuthModal } = useAuth()

  const searchBoxRef = useRef<HTMLDivElement>(null)
  const genreBoxRef = useRef<HTMLDivElement>(null)
  const profileBoxRef = useRef<HTMLDivElement>(null)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    setIsSearchOpen(false)
    setIsGenreOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    let cancelled = false
    setLoadingGenres(true)
    getGenres()
      .then((list) => {
        if (!cancelled) setGenres(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setGenres([])
      })
      .finally(() => {
        if (!cancelled) setLoadingGenres(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSearchResults([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchMovies(trimmed, 1, controller.signal)
        .then((data) => setSearchResults(data.results.slice(0, MAX_RESULTS)))
        .catch(() => setSearchResults([]))
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchOpen(false)
      }
      if (genreBoxRef.current && !genreBoxRef.current.contains(target)) {
        setIsGenreOpen(false)
      }
      if (profileBoxRef.current && !profileBoxRef.current.contains(target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    goToSearch(query)
  }

  const goToSearch = (term: string) => {
    const trimmed = term.trim()
    setIsSearchOpen(false)
    if (!trimmed) return
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const openSearch = () => {
    setIsSearchOpen(true)
    setIsGenreOpen(false)
  }

  const surpriseMe = async () => {
    if (picking) return
    setPicking(true)
    try {
      const movie = await getRandomMovie()
      navigate(`/movie/${movie.id}`)
    } catch {
      setPicking(false)
    }
  }

  const toggleGenreOpen = () => {
    setIsSearchOpen(false)
    setIsGenreOpen((open) => !open)
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950/95 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Filmvault home"
        >
          <span className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-0 blur transition group-hover:opacity-60" />
            <img src={Logo} alt="" className="w-11 rounded-full border border-white/10" />
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-white sm:block">
            Film<span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">vault</span>
          </span>
        </Link>

        {/* Primary nav */}
        <div className="flex items-center gap-1.5">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/watchlist" className={navLinkClass} data-testid="watchlist-link">
            <span className="flex items-center gap-1.5">
              Watchlist
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-xs font-extrabold text-white ring-1 ring-white/30"
                data-testid="watchlist-count"
              >
                {watchlist.length}
              </span>
            </span>
          </NavLink>

          <NavLink to="/movie-night" className={navLinkClass}>
            <span className="flex items-center gap-1.5">
              <FaClapperboard className="text-blue-400" aria-hidden="true" />
              Movie Night
            </span>
          </NavLink>

          {/* Genres dropdown */}
          <div ref={genreBoxRef} className="relative">
            <button
              type="button"
              onClick={toggleGenreOpen}
              aria-expanded={isGenreOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-blue-300 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Genres
              <FaChevronDown
                className={`text-[10px] transition-transform duration-200 ${isGenreOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isGenreOpen && (
              <div className="absolute left-0 top-full z-50 mt-3 w-[19rem] rounded-2xl border border-white/10 bg-gray-900/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <FaFilm className="text-blue-400" aria-hidden="true" />
                  Browse by genre
                </div>
                {loadingGenres && genres.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-400">Loading genres…</p>
                ) : genres.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-400">No genres available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {genres.map((genre) => (
                      <Link
                        key={genre.id}
                        to={`/genre/${genre.id}`}
                        className="truncate rounded-lg px-3 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-blue-600 hover:text-white"
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Surprise Me */}
        <button
          type="button"
          onClick={surpriseMe}
          disabled={picking}
          aria-label="Surprise me with a random movie"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-bold text-gray-200 transition hover:bg-white/10 hover:text-white disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <FaDice
            className={picking ? 'animate-spin text-blue-400' : 'text-blue-400'}
            aria-hidden="true"
          />
          <span className="hidden md:block">{picking ? 'Rolling…' : 'Surprise Me'}</span>
        </button>

        {/* Search */}
        <div ref={searchBoxRef} className="relative ml-auto w-full sm:w-80">
          <form onSubmit={handleSubmit} role="search">
            <div className="relative">
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  openSearch()
                }}
                onFocus={openSearch}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsSearchOpen(false)
                }}
                placeholder="Search movies…"
                aria-label="Search movies"
                aria-expanded={isSearchOpen}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/10 pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none backdrop-blur transition focus:border-blue-500/60 focus:bg-white/15 focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </form>

          {/* Live results */}
          {isSearchOpen && query.trim().length >= MIN_QUERY_LENGTH && (
            <div className="absolute left-0 top-full z-50 mt-3 max-h-96 w-full overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {searchResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">Searching…</p>
              ) : (
                searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => goToSearch(movie.title)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/10"
                  >
                    <img
                      src={imageUrl(movie.poster_path, 'w300') ?? Logo}
                      onError={(event) => (event.currentTarget.src = Logo)}
                      alt=""
                      loading="lazy"
                      className="h-12 w-8 shrink-0 rounded-md object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-100">
                        {movie.title}
                      </span>
                      {releaseYear(movie.release_date) && (
                        <span className="text-xs text-gray-400">{releaseYear(movie.release_date)}</span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Top-Right Profile / Auth Button */}
        <div ref={profileBoxRef} className="relative">
          {isAuthenticated && user ? (
            // Authenticated Avatar Button
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-label="User profile menu"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1.5 pr-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${
                  getAvatarPreset(user.avatar).gradient
                } text-base shadow-sm ring-1 ring-white/20`}
              >
                {getAvatarPreset(user.avatar).emoji}
              </span>
              <span className="hidden max-w-[100px] truncate sm:inline-block">
                {user.name}
              </span>
              <FaChevronDown
                className={`h-2.5 w-2.5 text-gray-400 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            // Guest / Sign In Button
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-label="User account and profile menu"
              className="flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-600/10 px-3.5 py-1.5 text-sm font-bold text-blue-300 transition hover:bg-blue-600 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <FaUser className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
              <FaChevronDown
                className={`h-2.5 w-2.5 text-blue-400 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-gray-900/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {isAuthenticated && user ? (
                <>
                  {/* User summary */}
                  <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${
                        getAvatarPreset(user.avatar).gradient
                      } text-lg shadow-sm`}
                    >
                      {getAvatarPreset(user.avatar).emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{user.name}</div>
                      <div className="truncate text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>

                  {/* Nav Links */}
                  <div className="mt-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white"
                    >
                      <FaUser className="h-3.5 w-3.5 text-blue-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/watchlist"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex items-center gap-2.5">
                        <FaHeart className="h-3.5 w-3.5 text-red-400" />
                        <span>Watchlist</span>
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-gray-300">
                        {watchlist.length}
                      </span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <FaArrowRightFromBracket className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Guest Menu */}
                  <div className="border-b border-white/10 px-2 pb-3">
                    <div className="text-sm font-bold text-white">Guest Mode</div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      Sign in for personalized personas and synced profile settings.
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        openAuthModal('login')
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-center text-xs font-bold text-white shadow-md shadow-blue-900/30 transition hover:brightness-110"
                    >
                      Sign In / Sign Up
                    </button>

                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <FaUser className="h-3 w-3 text-blue-400" />
                      <span>Guest Profile & Stats</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}