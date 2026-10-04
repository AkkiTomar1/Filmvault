import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { asyncHandler } from '../lib/http.js'
import { toPublicUser } from '../lib/users.js'
import { currentUser, requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimit.js'

export const profileRouter = Router()

profileRouter.use(requireAuth)

const updateSchema = z.object({
  displayName: z.string().trim().min(1, 'Name cannot be empty.').max(60).nullish(),
  bio: z.string().trim().max(280, 'Bio must be at most 280 characters.').nullish(),
})

profileRouter.patch(
  '/',
  writeLimiter,
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const { displayName, bio } = req.body as z.infer<typeof updateSchema>

    const updated = await db.user.update({
      where: { id: user.id },
      // `undefined` means "leave alone"; `null` means "clear".
      data: {
        ...(displayName !== undefined ? { displayName: displayName || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
      },
    })

    res.json({ user: toPublicUser(updated) })
  }),
)