import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateSignup } from '../lib/validation'
import { toApiError } from '../api/client'
import { redirectStateFrom } from '../lib/auth-redirect'

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const target = redirectStateFrom(window.history.state) ?? '/profile'
    if (isAuthenticated) navigate(target, { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(undefined)
    setFieldErrors({})
    const errs = validateSignup({ email, password, displayName: displayName || undefined } as unknown as Parameters<typeof validateSignup>[0])
    if (errs.email || errs.password) {
      setFieldErrors(errs)
      return
    }
    setSubmitting(true)
    try {
      await signup({ email: email.trim().toLowerCase(), password, displayName: displayName.trim() || undefined })
    } catch (err) {
      const ae = toApiError(err as unknown)
      if (ae.fieldErrors?.email) setFieldErrors({ email: ae.fieldErrors.email })
      else if (ae.fieldErrors?.password) setFieldErrors({ password: ae.fieldErrors.password })
      else setFormError(ae.message || 'Failed to sign up')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button type="submit" disabled={submitting} className="mt-2 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60">{submitting ? 'Creating…' : 'Sign up'}</button>
        </form>
      </div>
    </div>
  )
}
