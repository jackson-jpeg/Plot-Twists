'use client'

/**
 * Auth Context — Clerk compatibility layer
 *
 * Provides a `useAuth()` hook that wraps Clerk's hooks to minimize
 * changes across the codebase. Components get the same interface
 * they used with Firebase Auth.
 */

import React, { createContext, useContext, useCallback } from 'react'
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/nextjs'

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
  signOut: () => Promise<void>
  getPlayerId: () => string
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: true,
  isOnline: true,
  signOut: async () => {},
  getPlayerId: () => '',
  getToken: async () => null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const { getToken } = useClerkAuth()

  const user: AuthUser | null = clerkUser
    ? {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        displayName: clerkUser.fullName ?? clerkUser.firstName ?? null,
        photoURL: clerkUser.imageUrl ?? null,
        phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
        isAnonymous: false,
      }
    : null

  const signOut = useCallback(async () => {
    await clerkSignOut()
  }, [clerkSignOut])

  const getPlayerId = useCallback((): string => {
    if (clerkUser) {
      return clerkUser.id
    }
    // Anonymous fallback for guests
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem('plottwists_player_id')
    if (!id) {
      id = `anon_${crypto.randomUUID()}`
      localStorage.setItem('plottwists_player_id', id)
    }
    return id
  }, [clerkUser])

  const value: AuthContextType = {
    user,
    loading: !isLoaded,
    isConfigured: true,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    signOut,
    getPlayerId,
    getToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
