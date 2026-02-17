/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens from the Authorization header.
 */

import type { Request, Response, NextFunction } from 'express'
import { verifyIdToken } from '../services/user.service'
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
 * Express middleware that verifies Firebase ID tokens.
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

  const idToken = authHeader.slice(7)
  const decoded = await verifyIdToken(idToken)
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = { uid: decoded.uid }
  next()
}
