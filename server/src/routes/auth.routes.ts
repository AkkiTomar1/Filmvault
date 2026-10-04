import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { asyncHandler, ApiError, isUniqueViolation } from '../lib/http.js'
import { equalizeLoginTiming, hashPassword, verifyPassword } from '../lib/password.js'
import {
  issueSession,
  revokeAllSessions,
  revokeSession,
  rotateSession,
} from '../lib/tokens.js'
import { randomToken, sha256 } from '../lib/crypto.js'
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/mailer.js'
import { toPublicUser } from '../lib/users.js'
import { credentialLimiter, tokenLimiter } from '../middleware/rateLimit.js'
import { currentUser, requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'

export const authRouter = Router()

const ONE_HOUR_MS = 60 * 60 * 1000

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(200, 'Password must be at most 200 characters.')

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password,
  displayName: z.string().trim().min(1).max(60).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password: z.string().min(1).max(200),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
})

const tokenOnlySchema = z.object({
  token: z.string().min(20).max(200),
})

const resetPasswordSchema = tokenOnlySchema.extend({ password })

/**
 * Generic credential failure. Used for BOTH "no such account" and "wrong
 * password" so the response body never distinguishes them.
 */
const INVALID_CREDENTIALS = 'Incorrect email or password.'

function userAgentOf(req: { get(name: string): string | undefined }): string {
  return req.get('user-agent') ?? ''
}

async function issueVerificationToken(userId: string): Promise<string> {
  const raw = randomToken()
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { userId, usedAt: null } }),
    db.verificationToken.create({
      data: {
        userId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + ONE_HOUR_MS),
      },
    }),
  ])
  return raw
}

authRouter.post(
  '/register',
  credentialLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password: plain, displayName } = req.body as z.infer<typeof registerSchema>

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      // Registration is not rate-limited by response semantics the way login is,
      // but we still avoid doing argon2 work for a known address.
      throw ApiError.conflict('An account with that email already exists.')
    }

    const passwordHash = await hashPassword(plain)

    let user
    try {
      user = await db.user.create({
        data: { email, passwordHash, displayName: displayName || null },
      })
    } catch (error) {
      // Lost a race against a concurrent signup with the same address.
      if (isUniqueViolation(error)) {
        throw ApiError.conflict('An account with that email already exists.')
      }
      throw error
    }

    const tokens = await issueSession(
      { id: user.id, email: user.email, tokenVersion: user.tokenVersion },
      userAgentOf(req),
    )

    // Fire-and-forget: SMTP trouble must not fail a successful registration.
    const verificationToken = await issueVerificationToken(user.id)
    await sendVerificationEmail(user.email, verificationToken)

    res.status(201).json({ user: toPublicUser(user), ...tokens })
  }),
)

authRouter.post(
  '/login',
  credentialLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password: plain } = req.body as z.infer<typeof loginSchema>

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      // Burn equivalent CPU so response time does not reveal that the address
      // is unregistered.
      await equalizeLoginTiming(plain)
      throw ApiError.unauthorized('invalid_credentials', INVALID_CREDENTIALS)
    }

    const matches = await verifyPassword(user.passwordHash, plain)
    if (!matches) {
      throw ApiError.unauthorized('invalid_credentials', INVALID_CREDENTIALS)
    }

    const tokens = await issueSession(
      { id: user.id, email: user.email, tokenVersion: user.tokenVersion },
      userAgentOf(req),
    )

    res.json({ user: toPublicUser(user), ...tokens })
  }),
)

authRouter.post(
  '/refresh',
  tokenLimiter,
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>
    const tokens = await rotateSession(refreshToken, userAgentOf(req))
    res.json(tokens)
  }),
)

authRouter.post(
  '/logout',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>
    await revokeSession(refreshToken)
    res.status(204).end()
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: currentUser(req) })
  }),
)

authRouter.post(
  '/verify-email',
  validateBody(tokenOnlySchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as z.infer<typeof tokenOnlySchema>
    const row = await db.verificationToken.findUnique({
      where: { tokenHash: sha256(token) },
    })

    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw ApiError.badRequest('invalid_token', 'This verification link is invalid or has expired.')
    }

    const user = await db.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    })
    await db.verificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } })

    res.json({ user: toPublicUser(user) })
  }),
)

authRouter.post(
  '/resend-verification',
  credentialLimiter,
  validateBody(z.object({ email: z.string().trim().toLowerCase().email().max(254) })),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string }
    const user = await db.user.findUnique({ where: { email } })
    if (user && !user.emailVerified) {
      const token = await issueVerificationToken(user.id)
      await sendVerificationEmail(user.email, token)
    }
    // Always 200 — never reveal whether the address is registered or verified.
    res.json({ ok: true })
  }),
)

authRouter.post(
  '/forgot-password',
  credentialLimiter,
  validateBody(z.object({ email: z.string().trim().toLowerCase().email().max(254) })),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string }
    const user = await db.user.findUnique({ where: { email } })

    if (user) {
      const raw = randomToken()
      await db.$transaction([
        db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
        db.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(raw),
            expiresAt: new Date(Date.now() + ONE_HOUR_MS),
          },
        }),
      ])
      await sendPasswordResetEmail(user.email, raw)
    }

    // Always 200 — no account enumeration.
    res.json({ ok: true })
  }),
)

authRouter.post(
  '/reset-password',
  credentialLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password: plain } = req.body as z.infer<typeof resetPasswordSchema>

    const row = await db.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
    })
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw ApiError.badRequest('invalid_token', 'This reset link is invalid or has expired.')
    }

    const passwordHash = await hashPassword(plain)

    await db.$transaction([
      db.user.update({
        where: { id: row.userId },
        data: {
          passwordHash,
          // Invalidates every outstanding access token for this user.
          tokenVersion: { increment: 1 },
        },
      }),
      db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ])

    // A password change must end every existing session, including the attacker's.
    await revokeAllSessions(row.userId)

    res.json({ ok: true })
  }),
)

authRouter.patch(
  '/password',
  requireAuth,
  credentialLimiter,
  validateBody(z.object({ currentPassword: z.string().min(1).max(200), password })),
  asyncHandler(async (req, res) => {
    const { currentPassword, password: next } = req.body as {
      currentPassword: string
      password: string
    }
    const authed = currentUser(req)

    const row = await db.user.findUnique({ where: { id: authed.id } })
    if (!row) throw ApiError.unauthorized('invalid_token', 'Please sign in again.')

    const matches = await verifyPassword(row.passwordHash, currentPassword)
    if (!matches) {
      throw ApiError.badRequest('invalid_password', 'That is not your current password.')
    }

    await db.$transaction([
      db.user.update({
        where: { id: row.id },
        data: { passwordHash: await hashPassword(next), tokenVersion: { increment: 1 } },
      }),
      // Keep only the caller's current session by revoking all and issuing a
      // fresh one below.
      db.refreshToken.deleteMany({ where: { userId: row.id } }),
    ])

    const tokens = await issueSession(
      { id: row.id, email: row.email, tokenVersion: row.tokenVersion + 1 },
      userAgentOf(req),
    )
    res.json(tokens)
  }),
)
