/**
 * Firebase Configuration — Firestore only
 *
 * Auth is handled by Clerk. Firebase is used only for Firestore database
 * and Firebase Storage (poster images).
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

// Check if Firebase is configured (needed for Firestore/Storage)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null
let initialized = false

export async function initializeFirebase(): Promise<boolean> {
  if (initialized) return !!app
  if (!isFirebaseConfigured || typeof window === 'undefined') {
    initialized = true
    return false
  }

  try {
    const firebaseApp = await import('firebase/app')
    const { initializeApp, getApps } = firebaseApp

    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    initialized = true
    return true
  } catch {
    logger.info('Firebase not available')
    initialized = true
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFirebaseApp(): any {
  return app
}
