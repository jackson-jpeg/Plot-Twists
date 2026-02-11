'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

/**
 * Register service worker for PWA functionality
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
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
