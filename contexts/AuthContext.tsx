'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initializeFirebase, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { getFirebaseErrorMessage } from '@/lib/authErrors'

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
  signOut: () => Promise<void>
  getPlayerId: () => string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  signIn: async () => ({ success: false, error: 'Not configured' }),
  signUp: async () => ({ success: false, error: 'Not configured' }),
  signInWithGoogle: async () => ({ success: false, error: 'Not configured' }),
  signInAnonymously: async () => ({ success: false, error: 'Not configured' }),
  sendPhoneCode: async () => ({ success: false, error: 'Not configured' }),
  verifyPhoneCode: async () => ({ success: false, error: 'Not configured' }),
  linkWithGoogle: async () => ({ success: false, error: 'Not configured' }),
  linkWithEmail: async () => ({ success: false, error: 'Not configured' }),
  linkWithPhone: async () => ({ success: false, error: 'Not configured' }),
  signOut: async () => {},
  getPlayerId: () => ''
})

export function useAuth() {
  return useContext(AuthContext)
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
      const success = await initializeFirebase()
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
              // No user - sign in anonymously
              try {
                // Migrate localStorage player ID if exists
                const localPlayerId = localStorage.getItem('plottwists_player_id')
                if (localPlayerId) {
                  localStorage.setItem('plottwists_migrated_player_id', localPlayerId)
                }

                await firebaseSignInAnonymously(auth as any)
                // The onAuthStateChanged will fire again with the anonymous user
              } catch {
                // If anonymous sign-in fails, allow guest play
                setUser(null)
                setLoading(false)
              }
            }
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.log('Firebase auth not available')
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

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithPhoneNumber } = firebaseAuth
      const auth = getFirebaseAuth()
      const confirmationResult = await signInWithPhoneNumber(auth as any, phone, verifier)
      return { success: true, verificationId: confirmationResult.verificationId }
    } catch (error: unknown) {
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

  const signOut = useCallback(async (): Promise<void> => {
    if (!firebaseReady) return

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signOut: firebaseSignOut } = firebaseAuth
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth as any)
    } catch (error) {
      console.error('Sign out error:', error)
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
    signIn,
    signUp,
    signInWithGoogle,
    signInAnonymously,
    sendPhoneCode,
    verifyPhoneCode,
    linkWithGoogle,
    linkWithEmail,
    linkWithPhone,
    signOut,
    getPlayerId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
