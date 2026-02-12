'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

/**
 * Register service worker for PWA functionality.
 * Also sets data-standalone attribute on <html> for CSS targeting.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
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
