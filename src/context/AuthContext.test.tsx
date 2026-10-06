import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { verifyJwtToken } from '../lib/jwt'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext with JWT Verification', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated by default (Guest Mode)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.isTokenVerified).toBe(false)
  })

  it('signs up a new user, issues signed JWT, and verifies it', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    let res: { success: boolean; error?: string } = { success: false }
    await act(async () => {
      res = await result.current.signup({
        name: 'Jane Cinephile',
        email: 'jane@example.com',
        password: 'password123',
        avatar: 'film',
      })
    })

    expect(res.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Jane Cinephile')
    expect(result.current.user?.email).toBe('jane@example.com')

    // JWT assertions
    expect(result.current.token).toBeTruthy()
    expect(result.current.isTokenVerified).toBe(true)
    expect(result.current.jwtPayload?.email).toBe('jane@example.com')
    expect(result.current.jwtPayload?.iss).toBe('filmvault-app')

    // Explicit verification check with Web Crypto API
    const verification = await verifyJwtToken(result.current.token!)
    expect(verification.valid).toBe(true)
    expect(verification.payload?.name).toBe('Jane Cinephile')
  })

  it('rejects duplicate email during sign up', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup({
        name: 'User 1',
        email: 'user@example.com',
        password: 'password123',
      })
    })

    let secondAttempt: { success: boolean; error?: string } = { success: false }
    await act(async () => {
      secondAttempt = await result.current.signup({
        name: 'User 2',
        email: 'user@example.com',
        password: 'password456',
      })
    })

    expect(secondAttempt.success).toBe(false)
    expect(secondAttempt.error).toContain('already exists')
  })

  it('logs out and clears JWT token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword1',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).not.toBeNull()

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isTokenVerified).toBe(false)
  })

  it('logs back in with valid credentials and issues verified JWT', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword1',
      })
      result.current.logout()
    })

    let loginRes: { success: boolean; error?: string } = { success: false }
    await act(async () => {
      loginRes = await result.current.login({
        email: 'john@example.com',
        password: 'securePassword1',
      })
    })

    expect(loginRes.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isTokenVerified).toBe(true)
    expect(result.current.token).toBeTruthy()
  })

  it('updates profile and re-signs JWT with updated claims', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup({
        name: 'Sam',
        email: 'sam@example.com',
        password: 'password123',
      })
    })

    const initialToken = result.current.token

    await act(async () => {
      await result.current.updateProfile({
        name: 'Samuel L.',
        bio: 'Hold onto your butts',
        preferredRegion: 'US',
      })
    })

    expect(result.current.user?.name).toBe('Samuel L.')
    expect(result.current.user?.preferredRegion).toBe('US')

    // JWT claims updated
    expect(result.current.jwtPayload?.name).toBe('Samuel L.')
    expect(result.current.jwtPayload?.preferredRegion).toBe('US')
    expect(result.current.token).not.toBe(initialToken)

    const verification = await verifyJwtToken(result.current.token!)
    expect(verification.valid).toBe(true)
    expect(verification.payload?.preferredRegion).toBe('US')
  })
})
