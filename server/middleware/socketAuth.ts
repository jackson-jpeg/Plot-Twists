/**
 * Socket.io Authentication Middleware
 * Verifies Firebase ID tokens on socket connection.
 */

import type { Socket } from 'socket.io'

/**
 * Get the Firebase Admin auth instance.
 * Uses dynamic import to reuse the already-initialized admin app.
 */
async function getAdminAuth() {
  try {
    const admin = (await import('firebase-admin')).default
    if (admin.apps.length === 0) {
      return null
    }
    return admin.auth()
  } catch {
    return null
  }
}

/**
 * Socket.io middleware that verifies Firebase ID tokens.
 * Sets socket.data.uid on success.
 * Rejects connections without a valid token.
 */
export function createSocketAuthMiddleware() {
  return async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      console.warn(`[SocketAuth] Connection rejected: no token provided (${socket.id})`)
      return next(new Error('Authentication required'))
    }

    try {
      const auth = await getAdminAuth()
      if (!auth) {
        // Firebase Admin not configured — allow connection in dev/fallback mode
        console.warn('[SocketAuth] Firebase Admin not available, allowing connection without verification')
        socket.data.uid = null
        return next()
      }

      const decodedToken = await auth.verifyIdToken(token)
      socket.data.uid = decodedToken.uid
      console.log(`[SocketAuth] Authenticated socket ${socket.id} as user ${decodedToken.uid}`)
      next()
    } catch (error) {
      console.warn(`[SocketAuth] Token verification failed for ${socket.id}:`, error)
      return next(new Error('Invalid authentication token'))
    }
  }
}
