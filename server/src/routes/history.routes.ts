import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { asyncHandler } from '../lib/http.js'
import { currentUser, requireAuth } from '../middleware/requireAuth.js'
import { parseQuery, validateBody } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

export const historyRouter = Router()

historyRouter.use(requireAuth)

const recordSchema = z.object({
  movieId: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  posterPath: z.string().trim().max(300).nullish(),
})

const listQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(24),
  offset: z.coerce.number().int().nonnegative().default(0),
})

function toEntry(row: {
  movieId: number
  title: string
  posterPath: string | null
  viewedAt: Date
}) {
  return {
    movieId: row.movieId,
    title: row.title,
    posterPath: row.posterPath,
    viewedAt: row.viewedAt.toISOString(),
  }
}

historyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const { limit, offset } = parseQuery(listQuery, req) as z.infer<typeof listQuery>

    const [rows, total] = await Promise.all([
      db.watchHistoryEntry.findMany({
        where: { userId: user.id },
        orderBy: { viewedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.watchHistoryEntry.count({ where: { userId: user.id } }),
    ])

    res.json({ entries: rows.map(toEntry), total })
  }),
)

/**
 * Records a visit. Upsert on (userId, movieId) and re-stamps `viewedAt`, so the
 * table holds one row per movie and `viewedAt` doubles as the
 * "continue watching" recency ordering.
 */
historyRouter.post(
  '/',
  writeLimiter,
  validateBody(recordSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const movie = req.body as z.infer<typeof recordSchema>

    const row = await db.watchHistoryEntry.upsert({
      where: { userId_movieId: { userId: user.id, movieId: movie.movieId } },
      create: {
        userId: user.id,
        movieId: movie.movieId,
        title: movie.title,
        posterPath: movie.posterPath ?? null,
      },
      update: {
        title: movie.title,
        posterPath: movie.posterPath ?? null,
        viewedAt: new Date(),
      },
    })

    res.status(201).json(toEntry(row))
  }),
)

historyRouter.delete(
  '/',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    await db.watchHistoryEntry.deleteMany({ where: { userId: user.id } })
    res.status(204).end()
  }),
)