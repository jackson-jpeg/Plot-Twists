/**
 * Platform detection for Capacitor / iOS native shell.
 *
 * WKWebView UA contains "AppleWebKit" but NOT "Safari/" — that's the key
 * signal that distinguishes the Capacitor shell from mobile Safari.
 */

export type Platform = 'ios-native' | 'web-ios' | 'web-android' | 'web-desktop'

/** True when running inside the Capacitor WKWebView shell */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor injects this on the window object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Capacitor?.isNativePlatform?.()) return true
  // Fallback: WKWebView UA has "AppleWebKit" but lacks "Safari/"
  const ua = navigator.userAgent
  return /AppleWebKit/.test(ua) && !/Safari\//.test(ua)
}

/** True when running inside the iOS Capacitor shell specifically */
export function isIOSNative(): boolean {
  if (!isCapacitorNative()) return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

/** Categorized platform for branching logic */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web-desktop'
  if (isIOSNative()) return 'ios-native'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'web-ios'
  if (/Android/.test(ua)) return 'web-android'
  return 'web-desktop'
}
