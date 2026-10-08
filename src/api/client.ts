import axios, { AxiosHeaders } from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, refreshSingleFlight, forceLogout, type ForcedLogoutReason } from './tokenManager'

export const API_URL: string =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  'https://filmvault-api-3ijb.onrender.com/api'
export const apiEnabled = Boolean(API_URL)

export const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Array<{ path: string[] | string; message: string }>
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string>

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

function toFieldErrors(details?: Array<{ path: string[] | string; message: string }>): Record<string, string> {
  const out: Record<string, string> = {}
  if (!details || details.length === 0) return out
  for (const d of details) {
    const p = Array.isArray(d.path) ? d.path.join('.') : d.path
    if (p) out[p] = d.message
  }
  return out
}

export function toApiError(error: unknown, fallbackMessage?: string): ApiError {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError
    const status = ax.response?.status ?? 0
    const body = ax.response?.data as ApiErrorBody | undefined
    if (body?.error) {
      const fe = toFieldErrors(body.error.details)
      return new ApiError(status, body.error.code, body.error.message, fe)
    }
    if (status === 0) {
      return new ApiError(0, 'network_error', 'Could not reach the server. Check your connection and try again.')
    }
    const msg = fallbackMessage ?? ax.message ?? 'Request failed'
    return new ApiError(status, 'request_failed', msg)
  }
  const msg = fallbackMessage ?? (error instanceof Error ? error.message : 'Unknown error')
  return new ApiError(0, 'unknown_error', msg)
}

const AUTH_EXEMPT = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/resend-verification',
]

function isAuthExempt(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? ''
  return AUTH_EXEMPT.some((u) => url.includes(u))
}

function reasonFrom(error: unknown): ForcedLogoutReason {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    const code = body?.error?.code
    if (code === 'token_reuse_detected') return 'token_reuse_detected'
    if (code === 'device_mismatch') return 'device_mismatch'
    if (code === 'token_expired') return 'refresh_expired'
    if (code === 'invalid_token' || code === 'missing_token') return 'refresh_invalid'
  }
  if (error instanceof ApiError) {
    if (error.code === 'token_reuse_detected') return 'token_reuse_detected'
    if (error.code === 'device_mismatch') return 'device_mismatch'
  }
  return 'refresh_invalid'
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${token}` )
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _filmvaultRetried?: boolean }

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status ?? 0
    const body = error.response?.data as ApiErrorBody | undefined
    const code = body?.error?.code

    const recoverable = status === 401 && config && !config._filmvaultRetried && !isAuthExempt(config)

    if (recoverable) {
      if (code === 'token_reuse_detected' || code === 'device_mismatch') {
        forceLogout(code)
        return Promise.reject(toApiError(error))
      }
      config._filmvaultRetried = true
      try {
        const token = await refreshSingleFlight()
        config.headers = AxiosHeaders.from(config.headers)
        config.headers.set('Authorization', `Bearer ${token}` )
        return client.request(config)
      } catch (refreshError) {
        forceLogout(reasonFrom(refreshError))
        return Promise.reject(toApiError(error))
      }
    }
    return Promise.reject(toApiError(error))
  }
)

