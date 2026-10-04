import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { asyncHandler } from '../lib/http.js'
import { currentUser, requireAuth } from '../middleware/requireAuth.js'
import { parseQuery, validateBody } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

export const watchlistRouter = Router()

watchlistRouter.use(requireAuth)

/**
 * Only these three fields are persisted. Everything else about a movie is
 * refetched from TMDB by the client, so no third-party catalogue data is
 * duplicated here.
 */
const movieInput = z.object({
  movieId: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  posterPath: z.string().trim().max(300).nullish(),
})

const bulkSchema = z.object({
  movies: z.array(movieInput).max(1000, 'Too many movies in one request.'),
})

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(500).default(500),
})

function toItem(row: { movieId: number; title: string; posterPath: string | null; addedAt: Date }) {
  return {
    movieId: row.movieId,
    title: row.title,
    posterPath: row.posterPath,
    addedAt: row.addedAt.toISOString(),
  }
}

watchlistRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const { limit } = parseQuery(listQuery, req) as z.infer<typeof listQuery>

    const rows = await db.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
      take: limit,
    })

    res.json({ items: rows.map(toItem) })
  }),
)

/**
 * Bulk upsert. This is also the guest-merge endpoint: the client POSTs its
 * localStorage watchlist here on first login, and the (userId, movieId) unique
 * index makes repeated submissions idempotent — a movie already on the list
 * keeps its original addedAt and is not duplicated.
 */
watchlistRouter.post(
  '/',
  writeLimiter,
  validateBody(bulkSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const { movies } = req.body as z.infer<typeof bulkSchema>

    if (movies.length > 0) {
      // Last write wins for metadata; addedAt is preserved by the upsert.
      await db.$transaction(
        movies.map((movie) =>
          db.watchlistItem.upsert({
            where: { userId_movieId: { userId: user.id, movieId: movie.movieId } },
            create: {
              userId: user.id,
              movieId: movie.movieId,
              title: movie.title,
              posterPath: movie.posterPath ?? null,
            },
            update: { title: movie.title, posterPath: movie.posterPath ?? null },
          }),
        ),
      )
    }

    const rows = await db.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
      take: 500,
    })

    res.json({ items: rows.map(toItem) })
  }),
)

watchlistRouter.delete(
  '/:movieId',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const movieId = Number(req.params.movieId)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      res.status(204).end()
      return
    }

    // Scoped to the session's userId, so a guessed id cannot touch anyone else.
    await db.watchlistItem.deleteMany({ where: { userId: user.id, movieId } })
    res.status(204).end()
  }),
)

watchlistRouter.delete(
  '/',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    await db.watchlistItem.deleteMany({ where: { userId: user.id } })
    res.status(204).end()
  }),
)