import { createApp } from './app.js'
import { env } from './env.js'
import { db } from './db.js'
import { pruneExpiredTokens } from './lib/tokens.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.info(
    `[filmvault-api] listening on :${env.PORT} (${env.NODE_ENV}) — allowing origins: ${env.CORS_ORIGINS.join(', ')}`,
  )
})

// Expired refresh/verification/reset rows accumulate forever otherwise.
const pruneTimer = setInterval(() => {
  pruneExpiredTokens().catch((error: unknown) => {
    console.error('[filmvault-api] token prune failed:', error)
  })
}, 6 * 60 * 60 * 1000)
pruneTimer.unref()

async function shutdown(signal: string): Promise<void> {
  console.info(`[filmvault-api] ${signal} received, shutting down.`)
  clearInterval(pruneTimer)
  server.close()
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))