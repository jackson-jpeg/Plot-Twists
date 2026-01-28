'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initializeFirebase, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'

// User type that matches Firebase User
interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean, error?: string }>
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
        const { onAuthStateChanged } = firebaseAuth
        const auth = getFirebaseAuth()

        if (auth) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
            if (firebaseUser) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
              })
            } else {
              setUser(null)
            }
            setLoading(false)
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

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean, error?: string }> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithEmailAndPassword } = firebaseAuth
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      return { success: false, error: message }
    }
  }, [firebaseReady])

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<{ success: boolean, error?: string }> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { createUserWithEmailAndPassword, updateProfile } = firebaseAuth
      const auth = getFirebaseAuth()
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      return { success: false, error: message }
    }
  }, [firebaseReady])

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean, error?: string }> => {
    if (!firebaseReady) {
      return { success: false, error: 'Authentication not configured' }
    }

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signInWithPopup, GoogleAuthProvider } = firebaseAuth
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google sign in failed'
      return { success: false, error: message }
    }
  }, [firebaseReady])

  const signOut = useCallback(async (): Promise<void> => {
    if (!firebaseReady) return

    try {
      const firebaseAuth = await import('firebase/auth')
      const { signOut: firebaseSignOut } = firebaseAuth
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth)
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
    signOut,
    getPlayerId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
