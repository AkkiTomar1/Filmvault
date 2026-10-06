import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    res.status(401).json({ error: 'Access denied: No token provided' })
    return
  }

  const secret = process.env.JWT_SECRET || 'filmvault_default_secret_key'

  try {
    const decoded = jwt.verify(token, secret) as { sub: string; email: string }
    req.userId = decoded.sub
    req.userEmail = decoded.email
    next()
  } catch {
    res.status(401).json({ error: 'Access denied: Invalid or expired token' })
  }
}
