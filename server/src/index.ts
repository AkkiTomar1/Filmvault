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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'filmvault-api', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/watchlist', watchlistRoutes)

// Connect to MongoDB & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Filmvault Server] Running on http://localhost:${PORT}`)
  })
})

export default app
