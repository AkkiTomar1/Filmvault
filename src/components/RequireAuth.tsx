import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSkeleton from './LoadingSkeleton'

export default function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'booting') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={6} />
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export function PublicOnly() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()
  const state = location.state as { from?: string } | null
  const to = state?.from || '/profile'
  if (status === 'booting') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={2} />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to={to} replace />
  }
  return <Outlet />
}
