import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { UserProfile, StoredUserAccount, SignupInput, LoginInput } from '../types/auth'
import { AVATAR_PRESETS } from '../lib/avatars'
import { createJwtToken, verifyJwtToken, decodeJwtPayload, type JwtPayload } from '../lib/jwt'
import { apiRegister, apiLogin, apiGetMe, apiUpdateProfile } from '../api/backend'
import { clearTokens } from '../api/tokenManager'

const USERS_STORAGE_KEY = 'filmvault_users_v1'
const JWT_STORAGE_KEY = 'filmvault_jwt_token_v1'

export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  jwtPayload: JwtPayload | null
  isTokenVerified: boolean
  isAuthenticated: boolean
  status: AuthStatus
  isAuthModalOpen: boolean
  authModalMode: 'login' | 'signup'
  openAuthModal: (mode?: 'login' | 'signup') => void
  closeAuthModal: () => void
  setAuthModalMode: (mode: 'login' | 'signup') => void
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>
  signup: (input: SignupInput) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (
    updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'bio' | 'preferredRegion'>>,
  ) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<UserProfile | null>
  setUser: (u: UserProfile | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadStoredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredUsers(users: StoredUserAccount[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to save users to localStorage', err)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [jwtPayload, setJwtPayload] = useState<JwtPayload | null>(null)
  const [isTokenVerified, setIsTokenVerified] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  // Cryptographically verify & sync JWT session on mount
  useEffect(() => {
    async function initializeSession() {
      try {
        const storedToken = localStorage.getItem(JWT_STORAGE_KEY)
        if (!storedToken) {
          setUser(null)
          setToken(null)
          setJwtPayload(null)
          setIsTokenVerified(false)
          setIsBooting(false)
          return
        }

        // 1. Try to validate with MongoDB backend API
        const serverCheck = await apiGetMe(storedToken)
        if (serverCheck.success && serverCheck.user) {
          const u: UserProfile = {
            ...serverCheck.user,
            displayName: serverCheck.user.displayName || serverCheck.user.name,
          }
          setUser(u)
          setToken(storedToken)
          setJwtPayload(decodeJwtPayload(storedToken))
          setIsTokenVerified(true)
          setIsBooting(false)
          return
        }

        // 2. Fallback to client-side Web Crypto verification
        const verification = await verifyJwtToken(storedToken)
        if (verification.valid && verification.payload) {
          const users = loadStoredUsers()
          const found = users.find((u) => u.id === verification.payload?.sub)

          if (found) {
            const { passwordHash: _, ...profile } = found
            const u: UserProfile = {
              ...profile,
              displayName: profile.displayName || profile.name,
            }
            setUser(u)
            setToken(storedToken)
            setJwtPayload(verification.payload)
            setIsTokenVerified(true)
          } else {
            const fallbackUser: UserProfile = {
              id: verification.payload.sub,
              name: verification.payload.name,
              displayName: verification.payload.name,
              email: verification.payload.email,
              avatar: verification.payload.avatar,
              preferredRegion: verification.payload.preferredRegion,
              createdAt: new Date().toISOString(),
            }
            setUser(fallbackUser)
            setToken(storedToken)
            setJwtPayload(verification.payload)
            setIsTokenVerified(true)
          }
        } else {
          localStorage.removeItem(JWT_STORAGE_KEY)
          setUser(null)
          setToken(null)
          setJwtPayload(null)
          setIsTokenVerified(false)
        }
      } catch (err) {
        console.error('Error during JWT session hydration:', err)
        setUser(null)
        setToken(null)
        setJwtPayload(null)
        setIsTokenVerified(false)
      } finally {
        setIsBooting(false)
      }
    }

    initializeSession()
  }, [])

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const signup = useCallback(
    async (input: SignupInput): Promise<{ success: boolean; error?: string }> => {
      const trimmedName = (input.name || input.displayName || input.email.split('@')[0]).trim()
      const trimmedEmail = input.email.trim().toLowerCase()
      const trimmedPassword = input.password.trim()

      if (!trimmedName) return { success: false, error: 'Name is required' }
      if (!trimmedEmail || !trimmedEmail.includes('@'))
        return { success: false, error: 'A valid email is required' }
      if (trimmedPassword.length < 6)
        return { success: false, error: 'Password must be at least 6 characters' }

      // 1. Try Backend API Registration
      const serverRes = await apiRegister({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        avatar: input.avatar || AVATAR_PRESETS[0].id,
      })

      if (serverRes.success && serverRes.token && serverRes.user) {
        localStorage.setItem(JWT_STORAGE_KEY, serverRes.token)
        const u: UserProfile = {
          ...serverRes.user,
          displayName: serverRes.user.displayName || serverRes.user.name,
        }
        setUser(u)
        setToken(serverRes.token)
        setJwtPayload(decodeJwtPayload(serverRes.token))
        setIsTokenVerified(true)
        setIsAuthModalOpen(false)
        return { success: true }
      }

      if (serverRes.error && serverRes.error !== 'Could not connect to backend server') {
        return { success: false, error: serverRes.error }
      }

      // 2. Fallback to Local Offline Store
      const users = loadStoredUsers()
      if (users.some((u) => u.email === trimmedEmail)) {
        return { success: false, error: 'An account with this email already exists' }
      }

      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      const avatar = input.avatar || AVATAR_PRESETS[0].id

      const newUser: StoredUserAccount = {
        id: userId,
        name: trimmedName,
        displayName: trimmedName,
        email: trimmedEmail,
        avatar,
        bio: '',
        createdAt: new Date().toISOString(),
        passwordHash: trimmedPassword,
      }

      users.push(newUser)
      saveStoredUsers(users)

      const jwtToken = await createJwtToken({
        sub: userId,
        name: trimmedName,
        email: trimmedEmail,
        avatar,
      })

      localStorage.setItem(JWT_STORAGE_KEY, jwtToken)

      const verification = await verifyJwtToken(jwtToken)
      const { passwordHash: _, ...profile } = newUser

      setUser(profile)
      setToken(jwtToken)
      setJwtPayload(verification.payload ?? null)
      setIsTokenVerified(verification.valid)
      setIsAuthModalOpen(false)

      return { success: true }
    },
    [],
  )

  const login = useCallback(
    async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
      const trimmedEmail = input.email.trim().toLowerCase()
      const trimmedPassword = input.password.trim()

      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' }
      }
      if (!trimmedPassword) {
        return { success: false, error: 'Password is required' }
      }

      // 1. Try Backend API Login
      const serverRes = await apiLogin({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (serverRes.success && serverRes.token && serverRes.user) {
        localStorage.setItem(JWT_STORAGE_KEY, serverRes.token)
        const u: UserProfile = {
          ...serverRes.user,
          displayName: serverRes.user.displayName || serverRes.user.name,
        }
        setUser(u)
        setToken(serverRes.token)
        setJwtPayload(decodeJwtPayload(serverRes.token))
        setIsTokenVerified(true)
        setIsAuthModalOpen(false)
        return { success: true }
      }

      if (
        serverRes.error &&
        serverRes.error !== 'Could not connect to backend server' &&
        serverRes.error !== 'Network error'
      ) {
        return { success: false, error: serverRes.error }
      }

      // 2. Fallback to Local Offline Store
      const users = loadStoredUsers()
      const found = users.find((u) => u.email === trimmedEmail)

      if (!found || found.passwordHash !== trimmedPassword) {
        return { success: false, error: 'Invalid email or password' }
      }

      const jwtToken = await createJwtToken({
        sub: found.id,
        name: found.name,
        email: found.email,
        avatar: found.avatar,
        preferredRegion: found.preferredRegion,
      })

      localStorage.setItem(JWT_STORAGE_KEY, jwtToken)

      const verification = await verifyJwtToken(jwtToken)
      const { passwordHash: _, ...profile } = found

      setUser({ ...profile, displayName: profile.displayName || profile.name })
      setToken(jwtToken)
      setJwtPayload(verification.payload ?? null)
      setIsTokenVerified(verification.valid)
      setIsAuthModalOpen(false)

      return { success: true }
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(JWT_STORAGE_KEY)
    clearTokens()
    setUser(null)
    setToken(null)
    setJwtPayload(null)
    setIsTokenVerified(false)
  }, [])

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'bio' | 'preferredRegion'>>,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not authenticated' }

      // 1. Try Backend API update
      if (token) {
        const serverRes = await apiUpdateProfile(token, updates)
        if (serverRes.success && serverRes.user) {
          const u: UserProfile = {
            ...serverRes.user,
            displayName: serverRes.user.displayName || serverRes.user.name,
          }
          setUser(u)
          return { success: true }
        }
      }

      // 2. Fallback to Local Offline Store
      const users = loadStoredUsers()
      const idx = users.findIndex((u) => u.id === user.id)

      const updatedProfile: UserProfile = {
        ...user,
        ...updates,
        displayName: updates.name || user.displayName || user.name,
      }

      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          ...updates,
          displayName: updates.name || users[idx].displayName || users[idx].name,
        }
        saveStoredUsers(users)
      }

      setUser(updatedProfile)

      // Re-sign JWT token so new avatar/name is reflected in token payload
      const newToken = await createJwtToken({
        sub: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        avatar: updatedProfile.avatar,
        preferredRegion: updatedProfile.preferredRegion,
      })

      localStorage.setItem(JWT_STORAGE_KEY, newToken)
      setToken(newToken)
      setJwtPayload(decodeJwtPayload(newToken))
      setIsTokenVerified(true)

      return { success: true }
    },
    [user, token],
  )

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    if (!token) return user
    const res = await apiGetMe(token)
    if (res.success && res.user) {
      const u: UserProfile = { ...res.user, displayName: res.user.displayName || res.user.name }
      setUser(u)
      return u
    }
    return user
  }, [token, user])

  const isAuthenticated = Boolean(user && (token || isTokenVerified))
  const status: AuthStatus = isBooting ? 'booting' : isAuthenticated ? 'authenticated' : 'anonymous'

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      jwtPayload,
      isTokenVerified,
      isAuthenticated,
      status,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      setAuthModalMode,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
      setUser,
    }),
    [
      user,
      token,
      jwtPayload,
      isTokenVerified,
      isAuthenticated,
      status,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
    ],
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
