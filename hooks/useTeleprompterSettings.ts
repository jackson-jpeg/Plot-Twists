'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { TeleprompterSettings, TeleprompterVisibilityMode } from '@/lib/types'
import { DEFAULT_TELEPROMPTER_SETTINGS, TELEPROMPTER_PRESETS } from '@/lib/types'

const STORAGE_KEY = 'plottwists_teleprompter_settings'
const FIREBASE_DEBOUNCE_MS = 500

// Helper to get settings from localStorage
function getStoredSettings(): TeleprompterSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Helper to save settings to localStorage
function setStoredSettings(settings: TeleprompterSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function useTeleprompterSettings() {
  const { user, isConfigured } = useAuth()
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_TELEPROMPTER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const firebaseDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)

      // First, try localStorage for immediate loading
      const storedSettings = getStoredSettings()
      if (storedSettings) {
        setSettings(storedSettings)
      }

      // If authenticated, try to load from Firebase
      if (user && isConfigured && !user.isAnonymous) {
        try {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore')
          const { initializeFirebase } = await import('@/lib/firebase')

          await initializeFirebase()
          const db = getFirestore()
          const userDoc = await getDoc(doc(db, 'users', user.uid))

          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data?.preferences?.teleprompter) {
              const firebaseSettings = data.preferences.teleprompter as TeleprompterSettings
              setSettings(firebaseSettings)
              // Also update localStorage to keep in sync
              setStoredSettings(firebaseSettings)
            }
          }
        } catch (error) {
          console.log('Could not load teleprompter settings from Firebase:', error)
        }
      }

      setIsLoading(false)
    }

    loadSettings()
  }, [user, isConfigured])

  // Save settings to Firebase with debounce
  const saveToFirebase = useCallback(async (newSettings: TeleprompterSettings) => {
    if (!user || !isConfigured || user.isAnonymous) return

    try {
      const { getFirestore, doc, setDoc } = await import('firebase/firestore')
      const { initializeFirebase } = await import('@/lib/firebase')

      await initializeFirebase()
      const db = getFirestore()

      await setDoc(doc(db, 'users', user.uid), {
        preferences: {
          teleprompter: newSettings
        }
      }, { merge: true })
    } catch (error) {
      console.log('Could not save teleprompter settings to Firebase:', error)
    }
  }, [user, isConfigured])

  // Update settings
  const updateSettings = useCallback((updates: Partial<TeleprompterSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }

      // Save to localStorage immediately
      setStoredSettings(newSettings)

      // Debounce Firebase save
      if (firebaseDebounceRef.current) {
        clearTimeout(firebaseDebounceRef.current)
      }
      firebaseDebounceRef.current = setTimeout(() => {
        saveToFirebase(newSettings)
      }, FIREBASE_DEBOUNCE_MS)

      return newSettings
    })
  }, [saveToFirebase])

  // Set a preset mode
  const setPreset = useCallback((mode: Exclude<TeleprompterVisibilityMode, 'custom'>) => {
    const preset = TELEPROMPTER_PRESETS[mode]
    updateSettings({
      visibilityMode: mode,
      ...preset
    })
  }, [updateSettings])

  // Set custom values (automatically switches to custom mode)
  const setCustom = useCallback((pastLines: number | 'all', upcomingLines: number | 'all') => {
    updateSettings({
      visibilityMode: 'custom',
      pastLinesVisible: pastLines,
      upcomingLinesVisible: upcomingLines
    })
  }, [updateSettings])

  // Toggle auto-scroll
  const toggleAutoScroll = useCallback(() => {
    updateSettings({ autoScroll: !settings.autoScroll })
  }, [settings.autoScroll, updateSettings])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (firebaseDebounceRef.current) {
        clearTimeout(firebaseDebounceRef.current)
      }
    }
  }, [])

  return {
    settings,
    updateSettings,
    setPreset,
    setCustom,
    toggleAutoScroll,
    isLoading
  }
}
