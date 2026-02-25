'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { TeleprompterSettings, TeleprompterVisibilityMode } from '@/lib/types'
import { DEFAULT_TELEPROMPTER_SETTINGS, TELEPROMPTER_PRESETS } from '@/lib/types'
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'plottwists_teleprompter_settings'

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
  const { user } = useAuth()
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_TELEPROMPTER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount from localStorage only
  useEffect(() => {
    const storedSettings = getStoredSettings()
    if (storedSettings) {
      setSettings(storedSettings)
    }
    setIsLoading(false)
  }, [user])

  // Update settings
  const updateSettings = useCallback((updates: Partial<TeleprompterSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      // Save to localStorage immediately
      setStoredSettings(newSettings)
      return newSettings
    })
  }, [])

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

  return {
    settings,
    updateSettings,
    setPreset,
    setCustom,
    toggleAutoScroll,
    isLoading
  }
}
