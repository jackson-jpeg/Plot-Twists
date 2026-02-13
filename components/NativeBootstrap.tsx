'use client'

import { useEffect } from 'react'
import { isCapacitorNative } from '@/lib/platform'

/**
 * Runs once on mount inside Capacitor to make the WebView feel native.
 * No-ops silently on regular web browsers.
 */
export function NativeBootstrap() {
  useEffect(() => {
    if (!isCapacitorNative()) return

    // 1. Add class so CSS can target the native shell
    document.documentElement.classList.add('capacitor-native')

    // 2. Disable pinch-zoom in the native shell
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      const content = viewport.getAttribute('content') || ''
      if (!content.includes('maximum-scale=1')) {
        viewport.setAttribute(
          'content',
          content
            .replace(/maximum-scale=[\d.]+/, 'maximum-scale=1')
            .replace(/user-scalable=\w+/, 'user-scalable=no')
        )
      }
    }

    // 3. Configure StatusBar — match current theme
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        || (!document.documentElement.getAttribute('data-theme')
            && window.matchMedia('(prefers-color-scheme: dark)').matches)
      StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark }).catch(() => {})
      StatusBar.setBackgroundColor({ color: isDark ? '#0f0f23' : '#FDFCFA' }).catch(() => {})

      // Watch for theme changes
      const observer = new MutationObserver(() => {
        const nowDark = document.documentElement.getAttribute('data-theme') === 'dark'
          || (!document.documentElement.getAttribute('data-theme')
              && window.matchMedia('(prefers-color-scheme: dark)').matches)
        StatusBar.setStyle({ style: nowDark ? Style.Light : Style.Dark }).catch(() => {})
        StatusBar.setBackgroundColor({ color: nowDark ? '#0f0f23' : '#FDFCFA' }).catch(() => {})
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    }).catch(() => {})

    // 4. Configure Keyboard
    import('@capacitor/keyboard').then(({ Keyboard, KeyboardResize }) => {
      Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {})
      Keyboard.setScroll({ isDisabled: false }).catch(() => {})
    }).catch(() => {})

    // 5. Hide splash screen once the web app is loaded
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {})
    }).catch(() => {})

    // 6. App lifecycle — reconnect socket when returning to foreground
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // Force socket reconnect if disconnected
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any
          if (win.__plotTwistsSocket && !win.__plotTwistsSocket.connected) {
            win.__plotTwistsSocket.connect()
          }
        }
      })

      // 7. Deep link handling — navigate when a universal link opens the app
      App.addListener('appUrlOpen', ({ url }) => {
        try {
          const parsed = new URL(url)
          const path = parsed.pathname + parsed.search
          if (path && path !== '/') {
            window.location.assign(path)
          }
        } catch {
          // Invalid URL, ignore
        }
      })
    }).catch(() => {})
  }, [])

  return null
}
