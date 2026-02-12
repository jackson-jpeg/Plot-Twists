/**
 * Firebase Configuration
 *
 * To enable authentication, set these environment variables:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * Then install Firebase: npm install firebase
 */

import { logger } from '@/lib/logger'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase is configured via environment variables
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
)

// Firebase types - using any since Firebase may not be installed
// and types aren't guaranteed to align across versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null
let initialized = false

export async function initializeFirebase(): Promise<boolean> {
  if (initialized) return !!auth
  if (!isFirebaseConfigured || typeof window === 'undefined') {
    initialized = true
    return false
  }

  try {
    const firebaseApp = await import('firebase/app')
    const firebaseAuth = await import('firebase/auth')

    const { initializeApp, getApps } = firebaseApp
    const { getAuth } = firebaseAuth

    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    auth = getAuth(app)
    initialized = true
    return true
  } catch {
    // Firebase not installed or failed to initialize
    logger.info('Firebase not available - running in guest-only mode')
    initialized = true
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFirebaseAuth(): any {
  return auth
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFirebaseApp(): any {
  return app
}

/**
 * Create an invisible reCAPTCHA verifier for phone authentication
 * @param containerId - The ID of the HTML element to render the reCAPTCHA widget
 * @returns RecaptchaVerifier instance or null if Firebase is not initialized
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createRecaptchaVerifier(containerId: string): Promise<any | null> {
  if (!auth || typeof window === 'undefined') {
    return null
  }

  try {
    const container = document.getElementById(containerId)
    if (!container) {
      logger.warn('[Phone Auth] reCAPTCHA container not found:', containerId)
      return null
    }

    const firebaseAuth = await import('firebase/auth')
    const { RecaptchaVerifier } = firebaseAuth

    // Clear any existing verifier on the container
    container.innerHTML = ''

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        logger.warn('[Phone Auth] reCAPTCHA expired')
      }
    })

    // Render immediately to catch init errors early
    await verifier.render()

    return verifier
  } catch (error) {
    logger.error('[Phone Auth] Failed to create reCAPTCHA verifier:', error)
    return null
  }
}
