import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaUser,
  FaFilm,
  FaHeart,
  FaArrowRight,
  FaGlobe,
  FaStar,
  FaArrowRightFromBracket,
  FaCheck,
  FaPen,
  FaShieldHalved,
  FaKey,
  FaRotate,
  FaChevronDown,
} from 'react-icons/fa6'
import { useAuth } from '../context/AuthContext'
import { useWatchlistContext } from '../context/WatchlistContext'
import { useToast } from '../context/ToastContext'
import { AVATAR_PRESETS, getAvatarPreset } from '../lib/avatars'
import { imageUrl } from '../lib/images'
import { verifyJwtToken } from '../lib/jwt'

const REGION_OPTIONS = [
  { code: '', label: 'Auto (Browser Language / Location)' },
  { code: 'IN', label: 'India (IN)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (GB)' },
  { code: 'CA', label: 'Canada (CA)' },
  { code: 'AU', label: 'Australia (AU)' },
  { code: 'DE', label: 'Germany (DE)' },
  { code: 'FR', label: 'France (FR)' },
  { code: 'JP', label: 'Japan (JP)' },
]

export default function ProfilePage() {
  const {
    user,
    token,
    jwtPayload,
    isTokenVerified,
    isAuthenticated,
    logout,
    updateProfile,
    openAuthModal,
  } = useAuth()
  const { watchlist } = useWatchlistContext()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [preferredRegion, setPreferredRegion] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showRawToken, setShowRawToken] = useState(false)
  const [reverifying, setReverifying] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setAvatar(user.avatar)
      setPreferredRegion(user.preferredRegion || '')
    }
  }, [user])

  const activeAvatar = getAvatarPreset(user?.avatar)

  // Watchlist stats calculation
  const totalSaved = watchlist.length
  const avgRating =
    totalSaved > 0
      ? (
          watchlist.reduce((acc, m) => acc + (m.vote_average || 0), 0) /
          totalSaved
        ).toFixed(1)
      : '0.0'

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await updateProfile({
      name,
      bio,
      avatar,
      preferredRegion,
    })
    setSaving(false)
    if (res.success) {
      notify('Profile updated and JWT re-signed successfully!')
      setIsEditing(false)
    } else {
      notify(res.error || 'Failed to update profile')
    }
  }

  const handleReverifyToken = async () => {
    if (!token) return
    setReverifying(true)
    try {
      const res = await verifyJwtToken(token)
      if (res.valid) {
        notify('Signature Verified: Token is authentic and valid (HS256)!')
      } else {
        notify(res.error || 'JWT verification failed')
      }
    } finally {
      setReverifying(false)
    }
  }

  const handleLogout = () => {
    logout()
    notify('You have been signed out.')
    navigate('/')
  }

  // Guest State View (when not logged in)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/90 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
            {/* Glow decoration */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

            {/* Guest Icon */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/20 text-5xl ring-1 ring-white/15">
              👤
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              You are exploring as a{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Guest
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
              Filmvault is completely free and open. You can freely search movies, use Movie Night, and save movies in your local browser watchlist. Signing in is 100% optional if you want a custom persona, JWT verification, and persistent preferences.
            </p>

            {/* Guest Vault Snapshot */}
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-gray-800/80 p-5 text-left shadow-lg">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Local Watchlist
                </div>
                <div className="mt-1 text-2xl font-black text-white">
                  {totalSaved}{' '}
                  <span className="text-sm font-normal text-gray-400">movies</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Avg Rating
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-2xl font-black text-amber-400">
                  <FaStar className="h-4 w-4" />
                  <span>{avgRating}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/40 transition hover:brightness-110 sm:w-auto"
              >
                <FaUser className="h-4 w-4" />
                Sign In or Create Account
              </button>
              <Link
                to="/watchlist"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gray-800 px-6 py-3.5 text-sm font-bold text-gray-200 transition hover:bg-gray-700 hover:text-white sm:w-auto"
              >
                <FaHeart className="h-4 w-4 text-red-400" />
                View Local Watchlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Token parts for display
  const tokenParts = token ? token.split('.') : []

  // Authenticated Profile View
  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Top Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Glow decoration */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-5">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${activeAvatar.gradient} text-4xl shadow-xl ring-2 ring-white/20`}
              >
                {activeAvatar.emoji}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-white sm:text-3xl">
                    {user.name}
                  </h1>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                    {activeAvatar.label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-300">{user.email}</p>
                {user.bio ? (
                  <p className="mt-2 text-sm italic text-gray-200">"{user.bio}"</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Film enthusiast & Vault curator
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 hover:text-white"
              >
                <FaPen className="h-3 w-3" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 hover:text-red-100"
              >
                <FaArrowRightFromBracket className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Edit Profile Section */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-8 border-t border-white/10 pt-6"
            >
              <h2 className="mb-4 text-lg font-bold text-white">Customize Profile</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/15 bg-gray-800 px-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    Preferred Streaming Region
                  </label>
                  <select
                    value={preferredRegion}
                    onChange={(e) => setPreferredRegion(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/15 bg-gray-800 px-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {REGION_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code} className="bg-gray-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    Bio / Favorite Quote
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Cinema is a matter of what's in the frame and what's out."
                    className="h-10 w-full rounded-xl border border-white/15 bg-gray-800 px-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Avatar Selector */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-gray-300">
                    Change Persona Avatar
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_PRESETS.map((p) => {
                      const isSelected = avatar === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAvatar(p.id)}
                          className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${
                            p.gradient
                          } text-xl shadow-md transition hover:scale-105 ${
                            isSelected
                              ? 'ring-2 ring-white scale-105'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <span>{p.emoji}</span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-gray-900 shadow">
                              <FaCheck className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/40 hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* JWT Security & Cryptographic Verification Card */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <FaShieldHalved className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Cryptographic JWT Session</h2>
                  {isTokenVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                      <FaCheck className="h-2.5 w-2.5" />
                      Verified HS256
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Standard RFC 7519 HMAC-SHA256 signature verified with browser Web Crypto API
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReverifyToken}
              disabled={reverifying}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-gray-800 px-3.5 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-700 hover:text-white disabled:opacity-50"
            >
              <FaRotate className={`h-3 w-3 ${reverifying ? 'animate-spin' : ''}`} />
              <span>Verify Signature</span>
            </button>
          </div>

          {/* Token Claims Metadata */}
          {jwtPayload && (
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-gray-800/60 p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px]">Algorithm</span>
                <p className="font-mono text-white mt-0.5 font-bold">HS256</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px]">Issuer (iss)</span>
                <p className="font-mono text-white mt-0.5 font-bold">{jwtPayload.iss}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px]">Issued At (iat)</span>
                <p className="text-gray-200 mt-0.5">
                  {new Date(jwtPayload.iat * 1000).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold text-[10px]">Expires (exp)</span>
                <p className="text-gray-200 mt-0.5">
                  {new Date(jwtPayload.exp * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Raw Token Collapsible */}
          {token && tokenParts.length === 3 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowRawToken(!showRawToken)}
                className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <FaKey className="h-3 w-3" />
                <span>{showRawToken ? 'Hide Encoded Token' : 'Inspect Encoded JWT Token'}</span>
                <FaChevronDown
                  className={`h-2.5 w-2.5 transition-transform ${showRawToken ? 'rotate-180' : ''}`}
                />
              </button>

              {showRawToken && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] leading-relaxed break-all">
                  <div className="mb-2 flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-red-400">● Header</span>
                    <span className="text-purple-400">● Payload</span>
                    <span className="text-cyan-400">● Signature</span>
                  </div>
                  <span className="text-red-400">{tokenParts[0]}</span>
                  <span className="text-gray-500">.</span>
                  <span className="text-purple-400">{tokenParts[1]}</span>
                  <span className="text-gray-500">.</span>
                  <span className="text-cyan-400">{tokenParts[2]}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Watchlist */}
          <div className="rounded-2xl border border-white/10 bg-gray-900/90 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs uppercase font-bold tracking-wider">
                Vaulted Movies
              </span>
              <FaFilm className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2 text-3xl font-black text-white">{totalSaved}</div>
            <p className="mt-1 text-xs text-gray-400">Titles saved in your collection</p>
          </div>

          {/* Average Rating */}
          <div className="rounded-2xl border border-white/10 bg-gray-900/90 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs uppercase font-bold tracking-wider">
                Average Rating
              </span>
              <FaStar className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-black text-amber-400">
              {avgRating}{' '}
              <span className="text-sm font-semibold text-gray-400">/ 10</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Mean TMDB score of your watchlist</p>
          </div>

          {/* Preferred Region */}
          <div className="rounded-2xl border border-white/10 bg-gray-900/90 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs uppercase font-bold tracking-wider">
                Streaming Region
              </span>
              <FaGlobe className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {user.preferredRegion || 'Automatic'}
            </div>
            <p className="mt-1 text-xs text-gray-400">Target country for streaming links</p>
          </div>
        </div>

        {/* Recent Watchlist Snapshot */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gray-900/90 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Watchlist Highlights</h2>
            <Link
              to="/watchlist"
              className="flex items-center gap-1.5 text-xs font-bold text-blue-400 transition hover:text-blue-300"
            >
              <span>View All ({watchlist.length})</span>
              <FaArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {watchlist.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">You haven't saved any movies yet.</p>
              <Link
                to="/"
                className="mt-3 inline-block rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2 text-xs font-bold text-blue-300 hover:bg-blue-600/30"
              >
                Explore Trending Movies
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {watchlist.slice(0, 6).map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/60 transition hover:scale-105 hover:border-blue-500/40"
                >
                  <img
                    src={imageUrl(movie.poster_path, 'w300')}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover"
                  />
                  <div className="p-2">
                    <div className="truncate text-xs font-semibold text-white group-hover:text-blue-300">
                      {movie.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
