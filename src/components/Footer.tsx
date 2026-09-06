import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaHeart,
  FaMagnifyingGlass,
  FaGithub,
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
} from 'react-icons/fa6'
import Logo from '../assets/Na.jpg'
import { getGenres } from '../api/tmdb'
import type { Genre } from '../types/tmdb'

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/akki.tomar.9081',
    Icon: FaFacebookF,
    hover: 'hover:bg-[#1877F2]',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/ASTOMAR98',
    Icon: FaXTwitter,
    hover: 'hover:bg-black',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/suk0on1',
    Icon: FaInstagram,
    hover: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]',
  },
] as const

const EXPLORE_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Watchlist', to: '/watchlist' },
] as const

const FOOTER_GENRES = 6

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{children}</h3>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const [genres, setGenres] = useState<Genre[]>([])

  useEffect(() => {
    let cancelled = false
    getGenres()
      .then((list) => {
        if (!cancelled) setGenres(Array.isArray(list) ? list.slice(0, FOOTER_GENRES) : [])
      })
      .catch(() => {
        if (!cancelled) setGenres([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <div className="px-2 py-10 sm:px-3">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-8">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Filmvault home"
            >
              <img src={Logo} alt="" className="w-10 rounded-full border border-white/10" />
              <span className="text-xl font-extrabold tracking-tight text-white">
                Film<span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">vault</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Discover trending movies, search the catalog, and build your own watchlist — all in
              one place.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
              <FaHeart className="text-red-500" aria-hidden="true" />
              Made for movie lovers
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Footer explore">
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="h-px w-3 bg-blue-500/60 transition-all hover:w-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/AkkiTomar1/Filmvault"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-gray-400 transition hover:text-white"
                >
                  <FaGithub aria-hidden="true" /> Source
                </a>
              </li>
            </ul>
          </nav>

          {/* Popular genres */}
          <nav aria-label="Footer genres">
            <ColumnTitle>Popular Genres</ColumnTitle>
            <ul className="space-y-2.5">
              {genres.map((genre) => (
                <li key={genre.id}>
                  <Link
                    to={`/genre/${genre.id}`}
                    className="text-sm text-gray-400 transition hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search + social */}
          <div>
            <ColumnTitle>Follow</ColumnTitle>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-400 ${hover}`}
                >
                  <Icon aria-hidden="true" className="text-lg" />
                </a>
              ))}
            </div>
            <Link
              to="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 shadow-md transition hover:border-blue-500/50 hover:bg-white/10 hover:text-white"
            >
              <FaMagnifyingGlass className="text-blue-400" aria-hidden="true" />
              Search the catalog
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            © {year} Filmvault. Crafted by Akki.
          </p>
          <p className="text-xs text-gray-600">
            This product uses the{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 underline decoration-gray-600 underline-offset-2 transition hover:text-white"
            >
              TMDB API
            </a>{' '}
            but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  )
}