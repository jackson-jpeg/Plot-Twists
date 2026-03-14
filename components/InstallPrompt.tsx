'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStandaloneMode } from '@/hooks/useStandaloneMode'
import { SPRING } from '@/lib/motion'
import { isCapacitorNative } from '@/lib/platform'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'plot-twists-install-dismissed'
const IOS_DELAY_MS = 30_000

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const isStandalone = useStandaloneMode()
  const [showBanner, setShowBanner] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const dismiss = useCallback(() => {
    setShowBanner(false)
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
  }, [])

  useEffect(() => {
    if (isStandalone) return

    // Check if permanently dismissed
    try {
      if (localStorage.getItem(DISMISS_KEY) === 'true') return
    } catch {
      // localStorage unavailable
    }

    // Android / Desktop: listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      // Don't show banner if permanently dismissed
      try {
        if (localStorage.getItem(DISMISS_KEY) === 'true') return
      } catch { /* localStorage unavailable */ }
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // iOS Safari: show instructions after delay
    let iosTimer: ReturnType<typeof setTimeout> | undefined
    if (isIOS() && isSafari()) {
      setIsIOSDevice(true)
      iosTimer = setTimeout(() => setShowBanner(true), IOS_DELAY_MS)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [isStandalone])

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current
    if (!prompt) return

    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    deferredPromptRef.current = null
  }

  if (isStandalone || isCapacitorNative()) return null

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            padding: '16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-3)',
          }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={SPRING}
        >
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex-1 flex flex-col gap-0.5">
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                Install Plot Twists
              </strong>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                {isIOSDevice
                  ? 'Tap Share \u2192 Add to Home Screen'
                  : 'Add to your home screen for the best experience'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isIOSDevice && (
                <button
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                  onClick={handleInstall}
                  style={{
                    background: 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Install
                </button>
              )}
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                onClick={dismiss}
                style={{
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                {isIOSDevice ? 'Got it' : 'Not now'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
