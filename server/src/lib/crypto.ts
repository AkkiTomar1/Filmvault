import { createHash, randomBytes } from 'node:crypto'

/** URL-safe random string. 48 bytes => 64 base64url chars. */
export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * Hex SHA-256. Used for storing refresh/verification/reset tokens and for the
 * user-agent fingerprint — never for passwords, which need argon2 (slow,
 * memory-hard).
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}