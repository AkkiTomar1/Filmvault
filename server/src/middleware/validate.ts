import type { Request, RequestHandler } from 'express'
import type { ZodSchema, ZodTypeDef } from 'zod'
import { ApiError } from '../lib/http.js'

/**
 * Body validation as middleware: replaces `req.body` with the parsed value, so
 * handlers receive trimmed, coerced, fully typed input.
 *
 * Only `body` is mutated. Express defines `req.query` as a getter-only
 * property, so assigning to it throws under ESM strict mode — use
 * `parseQuery()` for query params instead.
 */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(toApiError(result.error))
      return
    }
    req.body = result.data
    next()
  }
}

/** Parses `req.query`, throwing an ApiError so asyncHandler catches it. */
export function parseQuery<T extends ZodTypeDef>(
  schema: ZodSchema<unknown, T>,
  req: Request,
): unknown {
  const result = schema.safeParse(req.query)
  if (!result.success) {
    throw toApiError(result.error)
  }
  return result.data
}

function toApiError(error: { issues: { path: (string | number)[]; message: string }[] }): ApiError {
  return ApiError.badRequest(
    'validation_failed',
    'Some of the details you entered look invalid.',
    error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  )
}