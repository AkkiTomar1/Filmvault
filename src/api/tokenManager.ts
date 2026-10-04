import type { TokenPair } from '../types/auth'

export const REFRESH_STORAGE_KEY = 'filmvault.refreshToken'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(REFRESH_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(REFRESH_STORAGE_KEY)
    }
  } catch {
    // ignore storage errors (private mode/quota)
  }
}

export function storeSession({ accessToken: a, refreshToken: r }: TokenPair): void {
  accessToken = a
  setRefreshToken(r)
}

export function clearTokens(): void {
  accessToken = null
  setRefreshToken(null)
}

export function hasStoredSession(): boolean {
  return Boolean(getRefreshToken())
}

export type ForcedLogoutReason =
  | 'token_reuse_detected'
  | 'device_mismatch'
  | 'refresh_expired'
  | 'refresh_invalid'
  | 'missing_token'

export type RefreshHandler = () => Promise<string>

export type ForcedLogoutHandler = (reason: ForcedLogoutReason) => void

let refreshHandler: RefreshHandler | null = null
let forcedLogoutHandler: ForcedLogoutHandler | null = null

export function registerAuthHandlers(handlers: {
  refresh: RefreshHandler
  onForcedLogout: ForcedLogoutHandler
}): () => void {
  refreshHandler = handlers.refresh
  forcedLogoutHandler = handlers.onForcedLogout
  return () => {
    refreshHandler = null
    forcedLogoutHandler = null
  }
}

export function getForcedLogoutHandler(): ForcedLogoutHandler | null {
  return forcedLogoutHandler
}

export function forceLogout(reason: ForcedLogoutReason): void {
  const handler = forcedLogoutHandler
  clearTokens()
  if (handler) {
    handler(reason)
  }
}

let inFlight: Promise<string> | null = null

export function refreshSingleFlight(): Promise<string> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    const handler = refreshHandler
    if (!handler) throw new Error('auth handlers not registered')
    return handler()
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}

export function resetTokenManager(): void {
  accessToken = null
  setRefreshToken(null)
  refreshHandler = null
  forcedLogoutHandler = null
  inFlight = null
}
