/**
 * Apple In-App Purchase Service
 *
 * Server-side verification of StoreKit 2 transactions using Apple's
 * App Store Server Library. Maps Apple product IDs to credit packages.
 */

import { logger } from '../../lib/logger'

// Apple product ID → credit mapping (consumable IAPs)
export const APPLE_PRODUCTS: Record<string, { credits: number; label: string }> = {
  'com.plottwists.credits.starter': { credits: 20, label: 'Starter Bank' },
  'com.plottwists.credits.party':   { credits: 50, label: 'Party Pack' },
  'com.plottwists.credits.pro':     { credits: 300, label: 'Producer' },
  'com.plottwists.credits.studio':  { credits: 1000, label: 'Studio Head' },
}

// Map internal package IDs to Apple product IDs
export const PACKAGE_TO_APPLE_PRODUCT: Record<string, string> = {
  starter: 'com.plottwists.credits.starter',
  party:   'com.plottwists.credits.party',
  pro:     'com.plottwists.credits.pro',
  studio:  'com.plottwists.credits.studio',
}

interface VerifyTransactionResult {
  success: boolean
  productId?: string
  credits?: number
  transactionId?: string
  error?: string
}

/**
 * Verify a StoreKit 2 JWS (JSON Web Signature) transaction with Apple.
 * Returns the product ID and credit amount if valid.
 */
export async function verifyTransaction(signedTransaction: string): Promise<VerifyTransactionResult> {
  try {
    const { SignedDataVerifier, Environment } = await import('@apple/app-store-server-library')

    const bundleId = 'com.plottwists.app'
    const appAppleId = Number(process.env.APPLE_APP_ID) || 0
    const environment = process.env.NODE_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX

    // Apple root certificates — load from env or use empty array for sandbox testing
    const rootCerts: Buffer[] = []
    if (process.env.APPLE_ROOT_CERT_PATH) {
      const fs = await import('fs')
      const certPaths = process.env.APPLE_ROOT_CERT_PATH.split(',')
      for (const certPath of certPaths) {
        rootCerts.push(fs.readFileSync(certPath.trim()))
      }
    }

    const verifier = new SignedDataVerifier(rootCerts, true, environment, bundleId, appAppleId)
    const payload = await verifier.verifyAndDecodeTransaction(signedTransaction)

    const productId = payload.productId
    if (!productId || !APPLE_PRODUCTS[productId]) {
      return { success: false, error: `Unknown product ID: ${productId}` }
    }

    const product = APPLE_PRODUCTS[productId]

    logger.info(`[Apple] Verified transaction: ${payload.transactionId} for ${productId} (${product.credits} credits)`)

    return {
      success: true,
      productId,
      credits: product.credits,
      transactionId: String(payload.transactionId),
    }
  } catch (error) {
    logger.error('[Apple] Transaction verification failed:', error)
    return { success: false, error: 'Transaction verification failed' }
  }
}

/**
 * Handle Apple S2S notification (refunds, revocations, etc.)
 */
export async function handleServerNotification(signedPayload: string): Promise<{
  type: string
  transactionId?: string
  productId?: string
}> {
  try {
    const { SignedDataVerifier, Environment } = await import('@apple/app-store-server-library')

    const bundleId = 'com.plottwists.app'
    const appAppleId = Number(process.env.APPLE_APP_ID) || 0
    const environment = process.env.NODE_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX

    const rootCerts: Buffer[] = []
    if (process.env.APPLE_ROOT_CERT_PATH) {
      const fs = await import('fs')
      const certPaths = process.env.APPLE_ROOT_CERT_PATH.split(',')
      for (const certPath of certPaths) {
        rootCerts.push(fs.readFileSync(certPath.trim()))
      }
    }

    const verifier = new SignedDataVerifier(rootCerts, true, environment, bundleId, appAppleId)
    const notification = await verifier.verifyAndDecodeNotification(signedPayload)

    const notificationType = notification.notificationType || 'UNKNOWN'

    logger.info(`[Apple] S2S notification: ${notificationType}`)

    return {
      type: notificationType,
      // Transaction details would be extracted from notification.data if needed
    }
  } catch (error) {
    logger.error('[Apple] S2S notification verification failed:', error)
    return { type: 'VERIFICATION_FAILED' }
  }
}
