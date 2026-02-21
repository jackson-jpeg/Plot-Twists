/**
 * Apple In-App Purchase Routes
 */

import type { Express } from 'express'
import { authenticateRequest } from '../middleware/auth'
import { addBankedCredits } from '../services/credit.service'
import { recordTransaction } from '../services/payment.service'
import { getDatabase, Collections } from '../db'
import { logger } from '../../lib/logger'

export function registerAppleRoutes(app: Express): void {
  app.post('/api/apple/verify-transaction', authenticateRequest, async (req, res) => {
    const { signedTransaction } = req.body
    const userId = req.user!.uid
    if (!signedTransaction) {
      res.status(400).json({ error: 'Missing signedTransaction' })
      return
    }

    try {
      const db = getDatabase()
      const { verifyTransaction } = await import('../services/apple.service')
      const result = await verifyTransaction(signedTransaction)

      if (!result.success || !result.credits || !result.transactionId) {
        res.status(400).json({ error: result.error || 'Verification failed' })
        return
      }

      // Check for duplicate transaction
      const existingTxn = await db.get(Collections.PAYMENT_TRANSACTIONS, `apple_${result.transactionId}`)
      if (existingTxn) {
        res.json({ success: true, credits: result.credits, alreadyProcessed: true })
        return
      }

      await addBankedCredits(userId, result.credits, 0)

      const appleModule = await import('../services/apple.service')
      await recordTransaction({
        userId,
        type: 'purchase',
        stripeEventId: `apple_${result.transactionId}`,
        amountCents: 0,
        creditsAdded: result.credits,
        packageId: result.productId || '',
        packageLabel: result.productId ? appleModule.APPLE_PRODUCTS[result.productId]?.label || '' : '',
        status: 'completed',
      })

      await db.set(Collections.PAYMENT_TRANSACTIONS, `apple_${result.transactionId}`, {
        userId,
        transactionId: result.transactionId,
        productId: result.productId,
        credits: result.credits,
        processedAt: Date.now(),
      })

      logger.info(`[Apple] Granted ${result.credits} credits to user ${userId}`)
      res.json({ success: true, credits: result.credits })
    } catch (error) {
      logger.error('[Apple] Verify transaction error:', error)
      res.status(500).json({ error: 'Failed to verify transaction' })
    }
  })

  app.post('/api/apple/webhook', async (req, res) => {
    const { signedPayload } = req.body
    if (!signedPayload) {
      res.status(400).json({ error: 'Missing signedPayload' })
      return
    }

    try {
      const { handleServerNotification } = await import('../services/apple.service')
      const result = await handleServerNotification(signedPayload)

      if (result.type === 'REFUND' || result.type === 'REVOKE') {
        logger.warn(`[Apple] ${result.type} notification for transaction ${result.transactionId}`)
      }

      res.json({ success: true })
    } catch (error) {
      logger.error('[Apple] Webhook error:', error)
      res.status(500).json({ error: 'Webhook processing failed' })
    }
  })
}
