import rateLimit, { type Options } from 'express-rate-limit'
import { env } from '../env.js'

/**
 * Behind Render the socket peer is an internal address, so rate limiting by IP
 * needs `trust proxy` to read X-Forwarded-For. `trust proxy` is set in app.ts.
 */
const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Successful requests must not count toward the budget, or a normal session
  // burning API calls would lock the user out of their own account.
  skipSuccessfulRequests: true,
}

/**
 * Credentials endpoints. Deliberately strict: 5 failures per 15 minutes is
 * what makes brute-forcing an argon2-hashed password impractical, while still
 * allowing a handful of typos.
 */
export const credentialLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: 'rate_limited',
      message: 'Too many attempts. Please wait 15 minutes and try again.',
    },
  },
})

/** Refresh/token endpoints. Also strict: an attacker with a token can hammer it. */
export const tokenLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: false,
  message: {
    error: { code: 'rate_limited', message: 'Too many requests. Please slow down.' },
  },
})

/** Everything else (watchlist/history/reviews writes). */
export const writeLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 100,
  message: {
    error: { code: 'rate_limited', message: 'Too many requests. Please slow down.' },
  },
})

/** Coarse global cap so the free-tier instance cannot be cheaply overwhelmed. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'rate_limited', message: 'Too many requests.' },
  },
})