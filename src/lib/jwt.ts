/**
 * Client-Side JWT generation and verification using browser Web Crypto API (HMAC-SHA256).
 * Fully self-contained, standard RFC 7519 compliant, with no external dependencies.
 */

export interface JwtPayload {
  sub: string // User ID
  name: string
  email: string
  avatar: string
  preferredRegion?: string
  iat: number // Issued at (seconds)
  exp: number // Expiration (seconds)
  iss: string // Issuer ("filmvault-app")
}

// In client-side demonstration, use an application HMAC key
const SECRET_SEED = 'filmvault-secure-jwt-hmac-sha256-secret-seed-2026'

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlToBuffer(str: string): Uint8Array {
  const binary = base64UrlDecode(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(SECRET_SEED)
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/**
 * Sign and create a JWT token with HMAC-SHA256
 */
export async function createJwtToken(
  payloadData: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>,
  expiresInSeconds = 7 * 24 * 3600, // 7 days default
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JwtPayload = {
    ...payloadData,
    iss: 'filmvault-app',
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const key = await getHmacKey()
  const encoder = new TextEncoder()
  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(unsignedToken),
  )

  const encodedSignature = bufferToBase64Url(signatureBuffer)
  return `${unsignedToken}.${encodedSignature}`
}

/**
 * Verify a JWT token: checks cryptographic signature and expiration
 */
export async function verifyJwtToken(
  token: string,
): Promise<{ valid: boolean; payload?: JwtPayload; error?: string }> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' }
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    const key = await getHmacKey()
    const encoder = new TextEncoder()
    const signatureBytes = base64UrlToBuffer(encodedSignature)

    const isValidSignature = await window.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes.buffer as ArrayBuffer,
      encoder.encode(unsignedToken),
    )

    if (!isValidSignature) {
      return { valid: false, error: 'Invalid cryptographic signature' }
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token has expired', payload }
    }

    return { valid: true, payload }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Token verification failed',
    }
  }
}

/**
 * Decode token payload without cryptographic verification (for fast client reading)
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}
