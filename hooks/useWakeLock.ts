'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        logger.debug('Wake Lock activated')

        wakeLockRef.current.addEventListener('release', () => {
          logger.debug('Wake Lock released')
        })
      }
    } catch (err) {
      logger.error('Failed to activate Wake Lock:', err)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (err) {
        logger.error('Failed to release Wake Lock:', err)
      }
    }
  }

  useEffect(() => {
    // Request wake lock on mount
    requestWakeLock()

    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [])

  return { wakeLock: wakeLockRef.current }
}
