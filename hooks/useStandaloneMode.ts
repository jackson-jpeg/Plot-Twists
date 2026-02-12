'use client'

import { useState, useEffect } from 'react'

/**
 * Detects if the app is running in standalone/installed mode (PWA).
 * Checks navigator.standalone (iOS) and display-mode: standalone media query.
 */
export function useStandaloneMode(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const checkStandalone =
      // iOS Safari
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      // Android / Desktop Chrome
      window.matchMedia('(display-mode: standalone)').matches

    setIsStandalone(checkStandalone)

    // Listen for changes (e.g., app installed while page is open)
    const mql = window.matchMedia('(display-mode: standalone)')
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isStandalone
}
