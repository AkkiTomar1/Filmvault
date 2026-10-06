import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccountMenu() {
  const { status, user, isAuthenticated, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  if (status === 'booting') {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">Sign in</Link>
        <Link to="/signup" className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600">Sign up</Link>
      </div>
    )
  }

  const initial = (user.displayName || user.name || user.email).trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-300"
        aria-haspopup="menu"
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <Link to="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
          <button onClick={handleSignOut} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
        </div>
      )}
    </div>
  )
}
