import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import watchlistRoutes from './routes/watchlistRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
)
app.use(express.json())

// Health check endpoints
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'filmvault-api', timestamp: new Date().toISOString() })
})

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
})

// TMDB Proxy to bypass ISP and corporate network DNS blocks
app.all('/api/tmdb/*', async (req, res) => {
  try {
    const tmdbPath = req.originalUrl.replace(/^\/api\/tmdb/, '')
    const targetUrl = new URL(`https://api.themoviedb.org/3${tmdbPath}`)

    if (!targetUrl.searchParams.has('api_key')) {
      const serverKey = process.env.TMDB_API_KEY || '386a5f00b26fb16d13fac5cf2a8f525b'
      targetUrl.searchParams.set('api_key', serverKey)
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        Accept: 'application/json',
      },
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: 'TMDB proxy failure', message: msg })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/watchlist', watchlistRoutes)

// Connect to MongoDB & Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Filmvault Server] Running on http://localhost:${PORT}`)
    })
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[Filmvault Server] MongoDB connection deferred (${message}), starting server on http://localhost:${PORT}`)
    app.listen(PORT, () => {
      console.log(`[Filmvault Server] Running on http://localhost:${PORT}`)
    })
  })

export default app
