/**
 * Typed HTTP errors plus the shared async wrapper and terminal error handler.
 * Handlers throw; this is the only place that decides status codes and the
 * response body shape, so internal details never leak by accident.
 */

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(400, code, message, details)
  }

  static unauthorized(code: string, message: string): ApiError {
    return new ApiError(401, code, message)
  }

  static notFound(message = 'Not found'): ApiError {
    return new ApiError(404, 'not_found', message)
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'conflict', message)
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, 'rate_limited', message)
  }
}


/**
 * Wraps an async route so a rejected promise reaches Express's error pipeline
 * instead of becoming an unhandled rejection.
 */
export function asyncHandler(
  fn: (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<unknown>,
): (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

/** Prisma error codes we map to specific statuses. */
const PRISMA_UNIQUE_VIOLATION = 'P2002'
const PRISMA_RECORD_NOT_FOUND = 'P2025'

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION
  )
}

export function errorHandler(
  error: unknown,
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
  _next: unknown,
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  if (isUniqueViolation(error)) {
    res.status(409).json({
      error: { code: 'conflict', message: 'That record already exists.' },
    })
    return
  }

  const code = (error as { code?: string } | null)?.code
  if (code === PRISMA_RECORD_NOT_FOUND) {
    res.status(404).json({ error: { code: 'not_found', message: 'Not found.' } })
    return
  }

  // Malformed JSON from express.json() surfaces as a SyntaxError with a status.
  const status = (error as { status?: number; statusCode?: number } | null)?.status ??
    (error as { statusCode?: number } | null)?.statusCode
  if (status === 400) {
    res.status(400).json({ error: { code: 'bad_request', message: 'Malformed request body.' } })
    return
  }

  // Anything reaching here is a bug. Log it server-side, return nothing useful
  // to the client.
  console.error('[filmvault-api] unhandled error:', error)
  res.status(500).json({
    error: { code: 'internal_error', message: 'Something went wrong on our end.' },
  })
}


