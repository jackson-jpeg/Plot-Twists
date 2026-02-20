'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initializeFirebase, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { getFirebaseErrorMessage } from '@/lib/authErrors'
import { logger } from '@/lib/logger'

// Auth result type
interface AuthResult {
  success: boolean
  error?: string
}

// User type that matches Firebase User
interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
  isAnonymous: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  isOnline: boolean
  signInAnonymously: () => Promise<AuthResult>
  signInWithCustomToken: (token: string) => Promise<AuthResult>
  updateDisplayName: (displayName: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  getPlayerId: () => string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  isOnline: true,
  signInAnonymously: async () => ({ success: false, error: 'Not configured' }),
  signInWithCustomToken: async () => ({ success: false, error: 'Not configured' }),
  updateDisplayName: async () => ({ success: false, error: 'Not configured' }),
  signOut: async () => {},
  getPlayerId: () => ''
})

export function useAuth() {
  return useContext(AuthContext)
}

// Debug helper to get missing Firebase config variables
export function getMissingFirebaseConfig(): string[] {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY')
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID')
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID')
  return missing
}

// Generate or get anonymous player ID from localStorage
function getAnonymousPlayerId(): string {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem('plottwists_player_id')
  if (!id) {
    id = `anon_${crypto.randomUUID()}`
    localStorage.setItem('plottwists_player_id', id)
  }
  return id
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Track network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Debug: Log Firebase config status on mount
  useEffect(() => {
    const missing = getMissingFirebaseConfig()
    if (missing.length > 0) {
      logger.warn('[AuthContext] Missing Firebase env vars:', missing)
    } else {
      logger.debug('[AuthContext] Firebase config complete, isFirebaseConfigured:', isFirebaseConfigured)
    }
  }, [])

  // Sign in anonymously
  const signInAnonymously = useCallback(async (): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInAnonymously: firebaseSignInAnonymously } = firebaseAuth
      const auth = getFirebaseAuth()

      // Migrate localStorage player ID if exists
      const localPlayerId = localStorage.getItem('plottwists_player_id')

      await firebaseSignInAnonymously(auth as any)

      // Store the old local ID for potential data migration
      if (localPlayerId) {
        localStorage.setItem('plottwists_migrated_player_id', localPlayerId)
      }

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    async function init() {
      let success = false
      try {
        success = await initializeFirebase()
      } catch (error) {
        logger.warn('[AuthContext] Firebase initialization failed, falling back to guest mode:', error)
        success = false
      }
      setFirebaseReady(success)

      if (!success) {
        setLoading(false)
        return
      }

      try {
        const firebaseAuth = await import('firebase/auth')
        const { onAuthStateChanged } = firebaseAuth
        const auth = getFirebaseAuth()

        if (auth) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unsubscribe = onAuthStateChanged(auth as any, async (firebaseUser: any) => {
            if (firebaseUser) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                phoneNumber: firebaseUser.phoneNumber,
                isAnonymous: firebaseUser.isAnonymous
              })
              setLoading(false)
            } else {
              // No user — do NOT auto sign in anonymously.
              // Users must explicitly sign up or log in.
              setUser(null)
              setLoading(false)
            }
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        logger.warn('[AuthContext] Firebase auth not available, continuing in guest mode')
        setFirebaseReady(false)
        setLoading(false)
      }
    }

    init()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Sign in with a custom token (used by server-side phone auth via Twilio)
  const signInWithCustomToken = useCallback(async (token: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithCustomToken: firebaseSignInWithCustomToken } = firebaseAuth
      const auth = getFirebaseAuth()
      await firebaseSignInWithCustomToken(auth as any, token)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Update display name
  const updateDisplayName = useCallback(async (displayName: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { updateProfile } = firebaseAuth
      const auth = getFirebaseAuth()
      const currentUser = auth?.currentUser

      if (!currentUser) {
        return { success: false, error: 'No user signed in' }
      }

      await updateProfile(currentUser, { displayName })

      // Update local user state
      setUser(prev => prev ? { ...prev, displayName } : null)

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  const signOut = useCallback(async (): Promise<void> => {
    if (!firebaseReady) return

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signOut: firebaseSignOut } = firebaseAuth
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth as any)
    } catch (error) {
      logger.error('Sign out error:', error)
    }
  }, [firebaseReady])

  // Get player ID - use Firebase UID if logged in, otherwise use anonymous ID
  const getPlayerId = useCallback((): string => {
    if (user) {
      return user.uid
    }
    return getAnonymousPlayerId()
  }, [user])

  const value: AuthContextType = {
    user,
    loading,
    isConfigured: isFirebaseConfigured && firebaseReady,
    isOnline,
    signInAnonymously,
    signInWithCustomToken,
    updateDisplayName,
    signOut,
    getPlayerId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
