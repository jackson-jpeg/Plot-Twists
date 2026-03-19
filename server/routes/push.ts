/**
 * Push Notification Registration Routes
 * Handles device token registration from native iOS/tvOS apps
 */

import type { Express } from 'express'
import { getDatabase } from '../db'
import { logger } from '../../lib/logger'

const PUSH_TOKENS_COLLECTION = 'push_tokens'

export function registerPushRoutes(app: Express): void {
  // Register a device token for push notifications
  app.post('/api/push/register', async (req, res) => {
    const { deviceToken, platform, userId } = req.body

    if (!deviceToken || !platform) {
      res.status(400).json({ error: 'Missing deviceToken or platform' })
      return
    }

    try {
      const db = getDatabase()
      const tokenId = `apns_${deviceToken.slice(0, 16)}`

      await db.set(PUSH_TOKENS_COLLECTION, tokenId, {
        token: deviceToken,
        platform,
        userId: userId || null,
        type: 'apns', // Distinguishes from FCM tokens
        registeredAt: Date.now(),
        lastUsedAt: Date.now(),
      })

      logger.info(`[Push] Registered APNs token for ${platform}${userId ? ` (user: ${userId})` : ''}`)
      res.json({ success: true })
    } catch (error) {
      logger.error('[Push] Token registration failed:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  })

  // Unregister a device token
  app.post('/api/push/unregister', async (req, res) => {
    const { deviceToken } = req.body

    if (!deviceToken) {
      res.status(400).json({ error: 'Missing deviceToken' })
      return
    }

    try {
      const db = getDatabase()
      const tokenId = `apns_${deviceToken.slice(0, 16)}`
      await db.delete(PUSH_TOKENS_COLLECTION, tokenId)

      logger.info('[Push] Unregistered APNs token')
      res.json({ success: true })
    } catch (error) {
      logger.error('[Push] Token unregistration failed:', error)
      res.status(500).json({ error: 'Unregistration failed' })
    }
  })
}
