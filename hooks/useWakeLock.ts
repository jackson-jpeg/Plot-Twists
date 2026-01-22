'use client'

import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      // Check if Wake Lock API is supported
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        console.log('Wake Lock activated')

        // Listen for release events
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock released')
        })
      } else {
        console.log('Wake Lock API not supported')
      }
    } catch (err) {
      console.error('Failed to activate Wake Lock:', err)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (err) {
        console.error('Failed to release Wake Lock:', err)
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
