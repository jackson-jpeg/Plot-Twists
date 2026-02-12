'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'
import { isCapacitorNative } from '@/lib/platform'

/**
 * Register service worker for PWA functionality.
 * Also sets data-standalone attribute on <html> for CSS targeting.
 * Skipped entirely inside Capacitor WKWebView (no SW support).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Skip service worker in Capacitor (WKWebView doesn't support it)
    if (isCapacitorNative()) return

    // Set data-standalone attribute for CSS targeting (covers older iOS)
    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) {
      document.documentElement.setAttribute('data-standalone', 'true')
    }

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.info('Service Worker registered successfully:', registration.scope)

          // Check for updates periodically
          registration.update()
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
