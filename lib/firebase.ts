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

// Firebase types - using unknown since Firebase may not be installed
// These will be narrowed through type guards when Firebase is available
type FirebaseApp = { name: string; options: Record<string, unknown> }
type FirebaseAuth = { currentUser: unknown; onAuthStateChanged: (callback: (user: unknown) => void) => () => void }

// Dynamic imports to handle cases where Firebase isn't installed
let app: FirebaseApp | null = null
let auth: FirebaseAuth | null = null
let initialized = false

export async function initializeFirebase(): Promise<boolean> {
  if (initialized) return !!auth
  if (!isFirebaseConfigured || typeof window === 'undefined') {
    initialized = true
    return false
  }

  try {
    // @ts-expect-error - Dynamic import of optional Firebase dependency
    const firebaseApp = await import('firebase/app')
    // @ts-expect-error - Dynamic import of optional Firebase dependency
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
    console.log('Firebase not available - running in guest-only mode')
    initialized = true
    return false
  }
}

export function getFirebaseAuth(): FirebaseAuth | null {
  return auth
}

export function getFirebaseApp(): FirebaseApp | null {
  return app
}
