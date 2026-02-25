/**
 * Clerk Authentication Middleware
 * Verifies Clerk session tokens from the Authorization header.
 */

import type { Request, Response, NextFunction } from 'express'
import { logger } from '../../lib/logger'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string }
    }
  }
}

/**
 * Verify a Clerk session token server-side.
 * Returns the decoded payload with `sub` (user ID) or null if invalid.
 */
async function verifyClerkToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { verifyToken } = await import('@clerk/backend')
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) {
      logger.warn('[Auth] CLERK_SECRET_KEY not set')
      return null
    }
    const decoded = await verifyToken(token, { secretKey })
    return decoded as unknown as { sub: string }
  } catch (error) {
    logger.warn('[Auth] Clerk token verification failed:', error)
    return null
  }
}

/**
 * Express middleware that verifies Clerk session tokens.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches `req.user = { uid }` to the request.
 * Returns 401 if token is missing or invalid.
 */
export async function authenticateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const token = authHeader.slice(7)
  const decoded = await verifyClerkToken(token)
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = { uid: decoded.sub }
  next()
}

export { verifyClerkToken }
