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

// Phone code result type
interface PhoneCodeResult {
  success: boolean
  verificationId?: string
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
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signInAnonymously: () => Promise<AuthResult>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendPhoneCode: (phone: string, verifier: any) => Promise<PhoneCodeResult>
  verifyPhoneCode: (verificationId: string, code: string) => Promise<AuthResult>
  linkWithGoogle: () => Promise<AuthResult>
  linkWithEmail: (email: string, password: string) => Promise<AuthResult>
  linkWithPhone: (verificationId: string, code: string) => Promise<AuthResult>
  updateDisplayName: (displayName: string) => Promise<AuthResult>
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  getPlayerId: () => string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  isOnline: true,
  signIn: async () => ({ success: false, error: 'Not configured' }),
  signUp: async () => ({ success: false, error: 'Not configured' }),
  signInWithGoogle: async () => ({ success: false, error: 'Not configured' }),
  signInAnonymously: async () => ({ success: false, error: 'Not configured' }),
  sendPhoneCode: async () => ({ success: false, error: 'Not configured' }),
  verifyPhoneCode: async () => ({ success: false, error: 'Not configured' }),
  linkWithGoogle: async () => ({ success: false, error: 'Not configured' }),
  linkWithEmail: async () => ({ success: false, error: 'Not configured' }),
  linkWithPhone: async () => ({ success: false, error: 'Not configured' }),
  updateDisplayName: async () => ({ success: false, error: 'Not configured' }),
  changePassword: async () => ({ success: false, error: 'Not configured' }),
  sendPasswordResetEmail: async () => ({ success: false, error: 'Not configured' }),
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
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  // Sign in anonymously (called automatically if no user on load)
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
        // Don't remove the old ID yet - keep as backup
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
        const { onAuthStateChanged, signInAnonymously: firebaseSignInAnonymously } = firebaseAuth
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

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithEmailAndPassword } = firebaseAuth
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth as any, email, password)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { createUserWithEmailAndPassword, updateProfile } = firebaseAuth
      const auth = getFirebaseAuth()
      const result = await createUserWithEmailAndPassword(auth as any, email, password)
      await updateProfile(result.user, { displayName })
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithPopup, GoogleAuthProvider } = firebaseAuth
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth as any, provider)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Phone Auth: Send verification code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendPhoneCode = useCallback(async (phone: string, verifier: any): Promise<PhoneCodeResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    if (!verifier) {
      logger.error('[Phone Auth] sendPhoneCode called with null/undefined verifier')
      return { success: false, error: 'reCAPTCHA not initialized. Please refresh the page and try again.' }
    }

    logger.info('[Phone Auth] Sending verification code to:', phone)

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithPhoneNumber } = firebaseAuth
      const auth = getFirebaseAuth()
      const confirmationResult = await signInWithPhoneNumber(auth as any, phone, verifier)

      if (!confirmationResult?.verificationId) {
        logger.error('[Phone Auth] signInWithPhoneNumber returned no verificationId')
        return { success: false, error: 'Failed to send verification code. Please try again.' }
      }

      logger.info('[Phone Auth] Verification code sent successfully')
      return { success: true, verificationId: confirmationResult.verificationId }
    } catch (error: unknown) {
      const errorCode = error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : 'unknown'
      logger.error('[Phone Auth] sendPhoneCode error:', errorCode, error)

      if (errorCode === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Phone authentication is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method > Phone.'
        }
      }
      if (errorCode === 'auth/invalid-app-credential') {
        return {
          success: false,
          error: 'App verification failed. This may indicate a reCAPTCHA or API key issue. Please refresh and try again.'
        }
      }

      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Phone Auth: Verify code and sign in
  const verifyPhoneCode = useCallback(async (verificationId: string, code: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { PhoneAuthProvider, signInWithCredential } = firebaseAuth
      const auth = getFirebaseAuth()
      const credential = PhoneAuthProvider.credential(verificationId, code)
      await signInWithCredential(auth as any, credential)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Account Linking: Link with Google
  const linkWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { linkWithPopup, GoogleAuthProvider } = firebaseAuth
      const auth = getFirebaseAuth()
      const currentUser = auth?.currentUser

      if (!currentUser) {
        return { success: false, error: 'No user signed in' }
      }

      const provider = new GoogleAuthProvider()
      await linkWithPopup(currentUser, provider)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Account Linking: Link with Email/Password
  const linkWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { EmailAuthProvider, linkWithCredential } = firebaseAuth
      const auth = getFirebaseAuth()
      const currentUser = auth?.currentUser

      if (!currentUser) {
        return { success: false, error: 'No user signed in' }
      }

      const credential = EmailAuthProvider.credential(email, password)
      await linkWithCredential(currentUser, credential)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Account Linking: Link with Phone
  const linkWithPhone = useCallback(async (verificationId: string, code: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { PhoneAuthProvider, linkWithCredential } = firebaseAuth
      const auth = getFirebaseAuth()
      const currentUser = auth?.currentUser

      if (!currentUser) {
        return { success: false, error: 'No user signed in' }
      }

      const credential = PhoneAuthProvider.credential(verificationId, code)
      await linkWithCredential(currentUser, credential)
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

  // Change password (requires reauthentication)
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = firebaseAuth
      const auth = getFirebaseAuth()
      const currentUser = auth?.currentUser

      if (!currentUser) {
        return { success: false, error: 'No user signed in' }
      }

      if (!currentUser.email) {
        return { success: false, error: 'No email associated with this account' }
      }

      // Reauthenticate the user first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // Now update the password
      await updatePassword(currentUser, newPassword)

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorMessage(error) }
    }
  }, [firebaseReady])

  // Send password reset email
  const sendPasswordResetEmail = useCallback(async (email: string): Promise<AuthResult> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { sendPasswordResetEmail: firebaseSendReset } = firebaseAuth
      const auth = getFirebaseAuth()
      await firebaseSendReset(auth as any, email)
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
    signIn,
    signUp,
    signInWithGoogle,
    signInAnonymously,
    sendPhoneCode,
    verifyPhoneCode,
    linkWithGoogle,
    linkWithEmail,
    linkWithPhone,
    updateDisplayName,
    changePassword,
    sendPasswordResetEmail,
    signOut,
    getPlayerId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
