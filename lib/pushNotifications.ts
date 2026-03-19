import { getApiBaseUrl } from '@/lib/api'
import { getAuthHeaders } from '@/lib/authHeaders'
import { logger } from '@/lib/logger'

// Module-level reference to auth getToken, set by registerPushNotifications
let _getAuthToken: (() => Promise<string | null>) | null = null

/**
 * Register for push notifications (web only — native is handled by SwiftUI).
 * Returns the FCM token or null on failure/denial.
 * @param getAuthToken - Clerk's getToken() function for authenticated API calls
 */
export async function registerPushNotifications(getAuthToken?: () => Promise<string | null>): Promise<string | null> {
  if (getAuthToken) _getAuthToken = getAuthToken
  try {
    return await registerWebPush()
  } catch (error) {
    logger.error('[Push] Registration failed:', error)
    return null
  }
}

/** Web push via Firebase Cloud Messaging */
async function registerWebPush(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!('Notification' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    logger.info('[Push] Web permission denied')
    return null
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app')
    const { getMessaging, getToken } = await import('firebase/messaging')

    // Reuse existing Firebase app or create for messaging
    const app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })

    const messaging = getMessaging(app)
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      logger.info('[Push] Web FCM token obtained')
      await saveTokenToServer(token)
      return token
    }
    return null
  } catch (error) {
    logger.error('[Push] Web FCM error:', error)
    return null
  }
}

/** Send the push token to the server for storage */
async function saveTokenToServer(token: string): Promise<void> {
  try {
    if (!_getAuthToken) {
      logger.warn('[Push] No auth token available, skipping server registration')
      return
    }
    const headers = await getAuthHeaders(_getAuthToken)
    await fetch(`${getApiBaseUrl()}/api/push/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        platform: 'web',
      }),
    })
  } catch (error) {
    logger.error('[Push] Failed to save token to server:', error)
  }
}

/** No-op — native push listeners were handled by Capacitor, now by SwiftUI */
export async function setupPushListeners(): Promise<void> {}
