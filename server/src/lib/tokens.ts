import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { db } from '../db.js'
import { ApiError } from './http.js'
import { randomToken, sha256 } from './crypto.js'

const ISSUER = 'filmvault-api'

interface TokenSubject {
  id: string
  email: string
  tokenVersion: number
}

export interface AccessTokenClaims {
  sub: string
  email: string
  ver: number
}

export function signAccessToken(user: TokenSubject): string {
  const claims: AccessTokenClaims = {
    sub: user.id,
    email: user.email,
    ver: user.tokenVersion,
  }
  return jwt.sign(claims, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
  })
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER })
    if (typeof decoded === 'string') {
      throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
    }
    const { sub, email, ver } = decoded as Record<string, unknown>
    if (typeof sub !== 'string' || typeof email !== 'string' || typeof ver !== 'number') {
      throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
    }
    return { sub, email, ver }
  } catch (error) {
    if (error instanceof ApiError) throw error
    // Distinguish "expired" so the client knows to attempt a silent refresh
    // rather than bouncing the user straight to the login page.
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('token_expired', 'Your session expired.')
    }
    throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
  }
}

export interface IssuedTokens {
  accessToken: string
  refreshToken: string
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}

/** Starts a brand-new rotation lineage for a login or registration. */
export async function issueSession(
  user: TokenSubject,
  userAgent: string,
): Promise<IssuedTokens> {
  const raw = randomToken()
  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(raw),
      familyId: randomToken(16),
      expiresAt: refreshExpiry(),
      userAgentHash: sha256(userAgent),
    },
  })
  return { accessToken: signAccessToken(user), refreshToken: raw }
}

/**
 * Rotates a refresh token.
 *
 * Refresh tokens are single-use. Presenting one that was already spent means
 * either the token was stolen or the client is buggy; in both cases the safe
 * move is to revoke the entire rotation family and every other session for that
 * user, then force a fresh sign-in.
 */
export async function rotateSession(rawToken: string, userAgent: string): Promise<IssuedTokens> {
  const row = await db.refreshToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
    include: { user: true },
  })

  if (!row) {
    throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
  }

  if (row.userAgentHash && row.userAgentHash !== sha256(userAgent)) {
    throw ApiError.unauthorized('device_mismatch', 'Sign in again from this device.')
  }

  if (row.usedAt) {
    await db.$transaction([
      db.refreshToken.deleteMany({ where: { familyId: row.familyId } }),
      db.refreshToken.deleteMany({ where: { userId: row.userId } }),
    ])
    throw ApiError.unauthorized(
      'token_reuse_detected',
      'For your security this session was ended. Please sign in again.',
    )
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    throw ApiError.unauthorized('token_expired', 'Please sign in again.')
  }

  if (row.user.tokenVersion <= 0) {
    throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
  }

  const next = randomToken()
  await db.$transaction([
    db.refreshToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.refreshToken.create({
      data: {
        userId: row.userId,
        tokenHash: sha256(next),
        familyId: row.familyId,
        expiresAt: refreshExpiry(),
        userAgentHash: row.userAgentHash,
      },
    }),
  ])

  return { accessToken: signAccessToken(row.user), refreshToken: next }
}

/** Logout: drop just the presented token's row. Best-effort. */
export async function revokeSession(rawToken: string): Promise<void> {
  await db.refreshToken.deleteMany({ where: { tokenHash: sha256(rawToken) } })
}

/** Used after a password change/reset. Kills every session for the user. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.refreshToken.deleteMany({ where: { userId } })
}

/** Housekeeping: drop rows that can no longer be used. */
export async function pruneExpiredTokens(): Promise<void> {
  const now = new Date()
  await db.$transaction([
    db.refreshToken.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.verificationToken.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.passwordResetToken.deleteMany({ where: { expiresAt: { lte: now } } }),
  ])
}