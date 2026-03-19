/**
 * Platform detection via user-agent parsing.
 *
 * The native app is now pure SwiftUI — Capacitor is no longer used.
 * These helpers detect mobile browsers and PWA standalone mode only.
 */

export type Platform = 'ios-native' | 'android-native' | 'web-ios' | 'web-android' | 'web-desktop'

/** Always returns false — the Capacitor native shell has been removed. */
export function isCapacitorNative(): boolean {
  return false
}

/** Always returns false — the Capacitor iOS shell has been removed. */
export function isIOSNative(): boolean {
  return false
}

/** Always returns false — the Capacitor Android shell has been removed. */
export function isAndroidNative(): boolean {
  return false
}

/** Categorized platform for branching logic */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web-desktop'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'web-ios'
  if (/Android/.test(ua)) return 'web-android'
  return 'web-desktop'
}
