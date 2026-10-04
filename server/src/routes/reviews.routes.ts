import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { ApiError, asyncHandler } from '../lib/http.js'
import { currentUser, requireAuth } from '../middleware/requireAuth.js'
import { parseQuery, validateBody } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

export const reviewsRouter = Router()

const rating = z
  .number()
  .int('Rating must be a whole number.')
  .min(1, 'Rating must be between 1 and 10.')
  .max(10, 'Rating must be between 1 and 10.')

const upsertSchema = z.object({
  rating,
  body: z.string().trim().max(4000).nullish(),
})

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
})

/**
 * Reviews are readable without an account (a movie page can show them to
 * guests), but writable only by their owner.
 */
reviewsRouter.get(
  '/movies/:movieId/reviews',
  asyncHandler(async (req, res) => {
    const movieId = Number(req.params.movieId)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      throw ApiError.badRequest('invalid_movie', 'That is not a valid movie id.')
    }

    const { page, pageSize } = parseQuery(listQuery, req) as z.infer<typeof listQuery>

    const [rows, total] = await Promise.all([
      db.review.findMany({
        where: { movieId },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          movieId: true,
          rating: true,
          body: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, displayName: true } },
        },
      }),
      db.review.count({ where: { movieId } }),
    ])

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      reviews: rows.map((row: { id: string; movieId: number; rating: number; body: string | null; createdAt: Date; updatedAt: Date; user: { id: string; displayName: string | null } }) => ({
        id: row.id,
        movieId: row.movieId,
        rating: row.rating,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        author: { id: row.user.id, displayName: row.user.displayName },
      })),
    })
  }),
)

reviewsRouter.post(
  '/movies/:movieId/reviews',
  requireAuth,
  writeLimiter,
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const movieId = Number(req.params.movieId)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      throw ApiError.badRequest('invalid_movie', 'That is not a valid movie id.')
    }

    const { rating: score, body } = req.body as z.infer<typeof upsertSchema>

    // One review per user per movie: this is an upsert, so "Save" on the form
    // edits an existing review rather than failing on the unique index.
    const row = await db.review.upsert({
      where: { userId_movieId: { userId: user.id, movieId } },
      create: { userId: user.id, movieId, rating: score, body: body || null },
      update: { rating: score, body: body || null },
      select: {
        id: true,
        movieId: true,
        rating: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.status(201).json({ review: { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() } })
  }),
)

reviewsRouter.delete(
  '/reviews/:id',
  requireAuth,
  writeLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    // The userId filter is what prevents deleting someone else's review.
    const { count } = await db.review.deleteMany({
      where: { id: String(req.params.id), userId: user.id },
    })
    if (count === 0) throw ApiError.notFound('That review does not exist.')
    res.status(204).end()
  }),
)





