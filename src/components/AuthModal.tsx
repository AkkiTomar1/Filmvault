import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaXmark,
  FaFilm,
  FaCheck,
} from 'react-icons/fa6'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AVATAR_PRESETS } from '../lib/avatars'

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
  } = useAuth()
  const { notify } = useToast()

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].id)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens or closes or mode changes
  useEffect(() => {
    setError(null)
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }, [isAuthModalOpen, authModalMode])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthModalOpen, closeAuthModal])

  if (!isAuthModalOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (authModalMode === 'login') {
        const result = await login({ email, password })
        if (result.success) {
          notify('Welcome back to Filmvault!')
        } else {
          setError(result.error || 'Failed to sign in')
        }
      } else {
        const result = await signup({
          name,
          email,
          password,
          avatar: selectedAvatar,
        })
        if (result.success) {
          notify('Account created! Welcome to Filmvault.')
        } else {
          setError(result.error || 'Failed to sign up')
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-gray-900 via-gray-950 to-black p-6 shadow-2xl shadow-blue-950/40">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-600/30 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <FaXmark className="h-4 w-4" />
        </button>

        {/* Header Branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
            <FaFilm className="h-6 w-6" />
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-white">
            {authModalMode === 'login' ? 'Welcome Back' : 'Create Filmvault Account'}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Save favorite movies, personalize streaming links, and track your watch habits.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mb-5 flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setAuthModalMode('login')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              authModalMode === 'login'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('signup')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              authModalMode === 'signup'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Your Name</label>
                <div className="relative">
                  <FaUser className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nolan Cinephile"
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">
                  Choose Your Movie Persona
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((p) => {
                    const isSelected = selectedAvatar === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedAvatar(p.id)}
                        title={p.label}
                        className={`group relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${p.gradient} text-lg shadow-md transition hover:scale-105 ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-105' : 'opacity-70 hover:opacity-100'
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
            </>
          )}

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-300">Email Address</label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-300">Password</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Please wait…' : authModalMode === 'login' ? 'Sign In' : 'Create My Account'}
          </button>
        </form>

        {/* Optional Guest Dismiss Notice */}
        <div className="mt-5 border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Login is completely optional.{' '}
            <button
              type="button"
              onClick={closeAuthModal}
              className="font-bold text-blue-400 underline hover:text-blue-300"
            >
              Continue as Guest
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
