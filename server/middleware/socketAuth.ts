/**
 * Socket.io Authentication Middleware
 * Verifies Firebase ID tokens on socket connection.
 */

import type { Socket } from 'socket.io'
import { upsertUser } from '../services/user.service'

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
 * Allows unauthenticated connections (uid will be null) so the app
 * works for guests; credit operations check uid themselves.
 */
export function createSocketAuthMiddleware() {
  return async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      // Allow connection without auth — guests can still play,
      // but credit/purchase features will require sign-in.
      socket.data.uid = null
      return next()
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

      try {
        await upsertUser(decodedToken.uid, {
          displayName: decodedToken.name || decodedToken.email?.split('@')[0],
          email: decodedToken.email,
          phoneNumber: decodedToken.phone_number,
        })
      } catch (profileError) {
        console.warn(`[SocketAuth] Failed to upsert user profile for ${decodedToken.uid}:`, profileError)
      }

      console.log(`[SocketAuth] Authenticated socket ${socket.id} as user ${decodedToken.uid}`)
      next()
    } catch (error) {
      console.warn(`[SocketAuth] Token verification failed for ${socket.id}:`, error)
      // Still allow connection but without uid — don't block the whole app
      socket.data.uid = null
      next()
    }
  }
}
