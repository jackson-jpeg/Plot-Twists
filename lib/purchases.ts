/**
 * StoreKit bridge for iOS In-App Purchases.
 *
 * Communicates with the native StoreKitBridge.swift via WKWebView
 * message handlers, then verifies the transaction server-side.
 */

import { getApiBaseUrl } from './api'
import { isIOSNative } from './platform'

// Map internal package IDs to Apple product IDs
const APPLE_PRODUCT_IDS: Record<string, string> = {
  starter: 'com.plottwists.credits.starter',
  party:   'com.plottwists.credits.party',
  pro:     'com.plottwists.credits.pro',
  studio:  'com.plottwists.credits.studio',
}

interface StoreKitResult {
  success: boolean
  signedTransaction?: string
  error?: string
}

interface PurchaseResult {
  success: boolean
  credits?: number
  error?: string
}

/**
 * Request a StoreKit purchase from the native layer.
 * Returns a promise that resolves when the native purchase completes.
 */
function requestNativePurchase(productId: string): Promise<StoreKitResult> {
  return new Promise((resolve) => {
    // Set up callback for native layer to call back into web
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__storeKitCallback = (result: StoreKitResult) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__storeKitCallback
      resolve(result)
    }

    // Send purchase request to native layer via WKWebView message handler
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).webkit?.messageHandlers?.storeKit?.postMessage({
        action: 'purchase',
        productId,
      })
    } catch {
      resolve({ success: false, error: 'StoreKit not available' })
    }

    // Timeout after 2 minutes (user might cancel or take time)
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__storeKitCallback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__storeKitCallback
        resolve({ success: false, error: 'Purchase timed out' })
      }
    }, 120_000)
  })
}

/**
 * Purchase credits via StoreKit (iOS native) flow.
 *
 * 1. Triggers native StoreKit purchase sheet
 * 2. Receives signed transaction from native layer
 * 3. Verifies transaction on server and grants credits
 */
export async function purchaseViaStoreKit(packageId: string, userId: string): Promise<PurchaseResult> {
  if (!isIOSNative()) {
    return { success: false, error: 'StoreKit is only available on iOS' }
  }

  const appleProductId = APPLE_PRODUCT_IDS[packageId]
  if (!appleProductId) {
    return { success: false, error: `Unknown package: ${packageId}` }
  }

  // Step 1: Request native purchase
  const nativeResult = await requestNativePurchase(appleProductId)
  if (!nativeResult.success || !nativeResult.signedTransaction) {
    return { success: false, error: nativeResult.error || 'Purchase cancelled' }
  }

  // Step 2: Verify transaction on server and grant credits
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/apple/verify-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: nativeResult.signedTransaction,
        userId,
      }),
    })

    const data = await res.json()
    if (data.success) {
      return { success: true, credits: data.credits }
    }
    return { success: false, error: data.error || 'Verification failed' }
  } catch {
    return { success: false, error: 'Server verification failed' }
  }
}
