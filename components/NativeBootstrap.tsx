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

    // 3. Configure StatusBar
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
      StatusBar.setBackgroundColor({ color: '#1a1a2e' }).catch(() => {})
    }).catch(() => {})

    // 4. Configure Keyboard
    import('@capacitor/keyboard').then(({ Keyboard, KeyboardResize }) => {
      Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {})
      Keyboard.setScroll({ isDisabled: false }).catch(() => {})
    }).catch(() => {})
  }, [])

  return null
}
