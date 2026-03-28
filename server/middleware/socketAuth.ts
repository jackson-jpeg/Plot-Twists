/**
 * Socket.io Authentication Middleware
 * Verifies Clerk session tokens on socket connection.
 */

import type { Socket } from 'socket.io'
import { upsertUser } from '../services/user.service'
import { logger } from '../../lib/logger'

/**
 * Verify a Clerk session token and return the user ID.
 */
async function verifyClerkToken(token: string): Promise<{ sub: string; email?: string; phone_number?: string } | null> {
  try {
    const { verifyToken } = await import('@clerk/backend')
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) {
      logger.warn('[SocketAuth] CLERK_SECRET_KEY not set')
      return null
    }
    const decoded = await verifyToken(token, { secretKey })
    return decoded as unknown as { sub: string; email?: string; phone_number?: string }
  } catch {
    return null
  }
}

/**
 * Socket.io middleware that verifies Clerk session tokens.
 * Sets socket.data.userId on success.
 * Allows unauthenticated connections (userId will be null) so the app
 * works for guests; credit operations check userId themselves.
 */
export function createSocketAuthMiddleware() {
  return async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token
    const playerSessionId = typeof socket.handshake.auth?.playerSessionId === 'string'
      ? socket.handshake.auth.playerSessionId
      : null

    socket.data.playerSessionId = playerSessionId

    if (!token) {
      logger.info(`[SocketAuth] No token for socket ${socket.id} — guest mode`)
      socket.data.userId = null
      socket.data.uid = null
      return next()
    }

    try {
      const decoded = await verifyClerkToken(token)
      if (!decoded) {
        logger.warn(`[SocketAuth] Token verification failed for socket ${socket.id} — allowing without auth. CLERK_SECRET_KEY set: ${!!process.env.CLERK_SECRET_KEY}`)
        socket.data.userId = null
        socket.data.uid = null
        return next()
      }

      const userId = decoded.sub
      socket.data.userId = userId
      socket.data.uid = userId // backward compat
      socket.data.email = decoded.email || null
      socket.data.phoneNumber = decoded.phone_number || null

      try {
        await upsertUser(userId, {
          displayName: decoded.email?.split('@')[0],
          email: decoded.email,
          phoneNumber: decoded.phone_number,
        })
      } catch (profileError) {
        logger.warn(`[SocketAuth] Failed to upsert user profile for ${userId}:`, profileError)
      }

      logger.info(`[SocketAuth] Authenticated socket ${socket.id} as user ${userId}`)
      next()
    } catch (error) {
      logger.warn(`[SocketAuth] Token verification failed for ${socket.id}:`, error)
      // Still allow connection but without userId
      socket.data.userId = null
      socket.data.uid = null
      next()
    }
  }
}
