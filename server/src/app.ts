import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './env.js'
import { errorHandler } from './lib/http.js'
import { globalLimiter } from './middleware/rateLimit.js'
import { authRouter } from './routes/auth.routes.js'
import { watchlistRouter } from './routes/watchlist.routes.js'
import { historyRouter } from './routes/history.routes.js'
import { reviewsRouter } from './routes/reviews.routes.js'
import { profileRouter } from './routes/profile.routes.js'

/**
 * Builds the Express app without calling listen(), so tests can drive it with
 * supertest against an ephemeral port.
 */
export function createApp() {
  const app = express()

  // Required behind Render so rate limiting sees the real client IP from
  // X-Forwarded-For rather than the internal proxy address.
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY)

  app.disable('x-powered-by')

  app.use(
    helmet({
      // The API only ever returns JSON; a restrictive default-src plus
      // frameAncestors none is all that matters here.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      // The SPA is served from a different origin entirely.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header = same-origin, curl, or a server-side call.
        if (!origin) return callback(null, true)
        if (env.CORS_ORIGINS.includes(origin)) return callback(null, true)
        callback(new Error('Origin not allowed by CORS'))
      },
      // No cookies are used, so credentials are deliberately off and
      // Access-Control-Allow-Credentials is never emitted.
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  )

  // 50kb comfortably fits a 1000-movie guest watchlist merge.
  app.use(express.json({ limit: '50kb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use(globalLimiter)

  app.use('/api/auth', authRouter)
  app.use('/api/watchlist', watchlistRouter)
  app.use('/api/history', historyRouter)
  app.use('/api', reviewsRouter)
  app.use('/api/profile', profileRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'No such endpoint.' } })
  })

  app.use(errorHandler)

  return app
}