import { isCapacitorNative } from '@/lib/platform'
import { getApiBaseUrl } from '@/lib/api'
import { getAuthHeaders } from '@/lib/authHeaders'
import { logger } from '@/lib/logger'

/**
 * Register for push notifications (native or web).
 * Returns the FCM token or null on failure/denial.
 */
export async function registerPushNotifications(): Promise<string | null> {
  try {
    if (isCapacitorNative()) {
      return await registerNativePush()
    }
    return await registerWebPush()
  } catch (error) {
    logger.error('[Push] Registration failed:', error)
    return null
  }
}

/** Native (iOS/Android) via @capacitor/push-notifications */
async function registerNativePush(): Promise<string | null> {
  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permResult = await PushNotifications.requestPermissions()
  if (permResult.receive !== 'granted') {
    logger.info('[Push] Native permission denied')
    return null
  }

  await PushNotifications.register()

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', async (token) => {
      logger.info('[Push] Native token:', token.value)
      await saveTokenToServer(token.value)
      resolve(token.value)
    })
    PushNotifications.addListener('registrationError', (error) => {
      logger.error('[Push] Native registration error:', error)
      resolve(null)
    })
  })
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
    const headers = await getAuthHeaders()
    await fetch(`${getApiBaseUrl()}/api/push/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        platform: isCapacitorNative() ? 'native' : 'web',
      }),
    })
  } catch (error) {
    logger.error('[Push] Failed to save token to server:', error)
  }
}

/** Set up notification tap handler for native */
export async function setupPushListeners(): Promise<void> {
  if (!isCapacitorNative()) return

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const roomCode = notification.notification.data?.roomCode
      if (roomCode) {
        window.location.assign(`/join?code=${roomCode}`)
      }
    })
  } catch {
    // Push notifications not available
  }
}
