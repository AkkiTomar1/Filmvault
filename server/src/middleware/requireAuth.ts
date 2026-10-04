import type { Request, RequestHandler } from 'express'
import { db } from '../db.js'
import { ApiError } from '../lib/http.js'
import { verifyAccessToken } from '../lib/tokens.js'
import type { PublicUser } from '../lib/users.js'



/**
 * Requires a valid `Authorization: Bearer <jwt>` access token.
 *
 * The `ver` claim is compared against `User.tokenVersion`, so bumping the
 * version (password change or reset) invalidates every outstanding access
 * token immediately rather than waiting for them to expire.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get('authorization')
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw ApiError.unauthorized('missing_token', 'Please sign in.')
    }

    const claims = verifyAccessToken(header.slice(7).trim())

    const user = await db.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        displayName: true,
        bio: true,
        createdAt: true,
        tokenVersion: true,
      },
    })

    if (!user) throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
    if (user.tokenVersion !== claims.ver) {
      throw ApiError.unauthorized('invalid_token', 'Please sign in again.')
    }

    req.user = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified !== null,
      displayName: user.displayName,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
    }
    next()
  } catch (error) {
    next(error)
  }
}

/** Narrows `req.user` for handlers mounted behind `requireAuth`. */
export function currentUser(req: Request): PublicUser {
  if (!req.user) throw ApiError.unauthorized('missing_token', 'Please sign in.')
  return req.user
}
