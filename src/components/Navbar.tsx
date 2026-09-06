import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FaHeart } from 'react-icons/fa6'
import Logo from '../assets/Na.jpg'
import { useWatchlistContext } from '../context/WatchlistContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xl font-bold transition ${isActive ? 'text-blue-400' : 'text-blue-500 hover:text-blue-400'}`

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { watchlist } = useWatchlistContext()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    setQuery('')
  }

  return (
    <nav className="flex items-center gap-3 border bg-gray-900 py-3 pl-3 pr-4 sm:gap-6">
      <img src={Logo} alt="Filmvault logo" className="w-[50px] rounded" />

      <div className="flex items-center gap-3 sm:gap-5">
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/watchlist" className={navLinkClass}>
          Watchlist
          <FaHeart className="ml-1 inline-block align-middle text-red-500" />
        </NavLink>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500 px-1.5 text-sm font-bold text-white">
          {watchlist.length}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="ml-auto flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies…"
          aria-label="Search movies"
          className="h-9 w-40 rounded-full bg-gray-800 px-4 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
        />
        <button
          type="submit"
          className="hidden rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-blue-500 sm:block"
        >
          Search
        </button>
      </form>
    </nav>
  )
}