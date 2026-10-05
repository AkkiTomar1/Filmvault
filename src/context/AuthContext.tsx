import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserProfile, StoredUserAccount, SignupInput, LoginInput } from '../types/auth'
import { AVATAR_PRESETS } from '../lib/avatars'
import { createJwtToken, verifyJwtToken, type JwtPayload } from '../lib/jwt'

const USERS_STORAGE_KEY = 'filmvault_users_v1'
const JWT_STORAGE_KEY = 'filmvault_jwt_token_v1'

interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  jwtPayload: JwtPayload | null
  isTokenVerified: boolean
  isAuthenticated: boolean
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  // Cryptographically verify JWT session on mount
  useEffect(() => {
    async function initializeSession() {
      try {
        const storedToken = localStorage.getItem(JWT_STORAGE_KEY)
        if (!storedToken) {
          setUser(null)
          setToken(null)
          setJwtPayload(null)
          setIsTokenVerified(false)
          return
        }

        const verification = await verifyJwtToken(storedToken)
        if (verification.valid && verification.payload) {
          const users = loadStoredUsers()
          const found = users.find((u) => u.id === verification.payload?.sub)

          if (found) {
            const { passwordHash: _, ...profile } = found
            setUser(profile)
            setToken(storedToken)
            setJwtPayload(verification.payload)
            setIsTokenVerified(true)
          } else {
            // User ID from JWT is not found in database
            localStorage.removeItem(JWT_STORAGE_KEY)
            setUser(null)
            setToken(null)
            setJwtPayload(null)
            setIsTokenVerified(false)
          }
        } else {
          // Token signature invalid or expired
          console.warn('JWT verification failed:', verification.error)
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
      const trimmedName = input.name.trim()
      const trimmedEmail = input.email.trim().toLowerCase()
      const trimmedPassword = input.password.trim()

      if (!trimmedName) return { success: false, error: 'Name is required' }
      if (!trimmedEmail || !trimmedEmail.includes('@'))
        return { success: false, error: 'A valid email is required' }
      if (trimmedPassword.length < 6)
        return { success: false, error: 'Password must be at least 6 characters' }

      const users = loadStoredUsers()
      if (users.some((u) => u.email === trimmedEmail)) {
        return { success: false, error: 'An account with this email already exists' }
      }

      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      const avatar = input.avatar || AVATAR_PRESETS[0].id

      const newUser: StoredUserAccount = {
        id: userId,
        name: trimmedName,
        email: trimmedEmail,
        avatar,
        bio: '',
        createdAt: new Date().toISOString(),
        passwordHash: trimmedPassword,
      }

      users.push(newUser)
      saveStoredUsers(users)

      // Generate signed JWT token
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

      const users = loadStoredUsers()
      const found = users.find((u) => u.email === trimmedEmail)

      if (!found) {
        return { success: false, error: 'No account found with this email' }
      }

      if (found.passwordHash !== trimmedPassword) {
        return { success: false, error: 'Incorrect password' }
      }

      // Generate signed JWT token
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

      setUser(profile)
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

      const users = loadStoredUsers()
      const index = users.findIndex((u) => u.id === user.id)
      if (index === -1) return { success: false, error: 'User record not found' }

      const updatedAccount: StoredUserAccount = {
        ...users[index],
        ...updates,
        name: updates.name ? updates.name.trim() : users[index].name,
      }

      users[index] = updatedAccount
      saveStoredUsers(users)

      const { passwordHash: _, ...newProfile } = updatedAccount
      setUser(newProfile)

      // Re-sign JWT with updated claims
      const newJwt = await createJwtToken({
        sub: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar,
        preferredRegion: newProfile.preferredRegion,
      })
      localStorage.setItem(JWT_STORAGE_KEY, newJwt)
      setToken(newJwt)

      const verification = await verifyJwtToken(newJwt)
      setJwtPayload(verification.payload ?? null)

      return { success: true }
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        jwtPayload,
        isTokenVerified,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
