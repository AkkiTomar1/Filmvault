import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/auth'
import { clearTokens, getRefreshToken, hasStoredSession, registerAuthHandlers, storeSession } from '../api/tokenManager'
import type { LoginInput, PublicUser, SignupInput, TokenPair } from '../types/auth'
import { apiEnabled } from '../api/client'

export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: PublicUser | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<PublicUser>
  signup: (input: SignupInput) => Promise<PublicUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<PublicUser>
  setUser: (u: PublicUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('booting')
  const [user, setUser] = useState<PublicUser | null>(null)
  const bootingRef = useRef(false)

  const refresh = useCallback(async (): Promise<string> => {
    const stored = getRefreshToken()
    if (!stored) throw new Error('no refresh token')
    const tokens = await authApi.refresh(stored)
    storeSession(tokens)
    return tokens.accessToken
  }, [])

  const onForcedLogout = useCallback((reason: string) => {
    clearTokens()
    setUser(null)
    setStatus('anonymous')
    void reason
  }, [])

  useEffect(() => {
    const unregister = registerAuthHandlers({ refresh, onForcedLogout })
    return () => {
      unregister()
    }
  }, [refresh, onForcedLogout])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (bootingRef.current) return
      bootingRef.current = true
      if (!apiEnabled) {
        setStatus('anonymous')
        return
      }
      if (!hasStoredSession()) {
        setStatus('anonymous')
        return
      }
      try {
        const me = await authApi.me()
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (cancelled) return
        clearTokens()
        setUser(null)
        setStatus('anonymous')
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput): Promise<PublicUser> => {
    const tokens: TokenPair = await authApi.login(input)
    storeSession(tokens)
    const me = await authApi.me()
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const signup = useCallback(async (input: SignupInput): Promise<PublicUser> => {
    const session = await authApi.register(input as unknown as SignupInput)
    storeSession(session as unknown as TokenPair)
    setUser((session as unknown as { user: PublicUser }).user)
    setStatus('authenticated')
    return (session as unknown as { user: PublicUser }).user
  }, [])

  const logout = useCallback(async () => {
    const token = getRefreshToken()
    try {
      if (token) {
        await authApi.logout(token)
      }
    } catch {
      // ignore
    }
    clearTokens()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const refreshUser = useCallback(async (): Promise<PublicUser> => {
    const me = await authApi.me()
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      login,
      signup,
      logout,
      refreshUser,
      setUser,
    }),
    [status, user, login, signup, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
