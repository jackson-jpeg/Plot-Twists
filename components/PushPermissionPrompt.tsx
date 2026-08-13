'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { registerPushNotifications } from '@/lib/pushNotifications'

const DISMISSED_KEY = 'pt-push-prompt-dismissed'

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed, already granted, or not supported
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return

    // Show after a short delay so it doesn't compete with initial load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleEnable = async () => {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
    await registerPushNotifications()
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={SPRING}
          style={{
            background: 'var(--color-ink)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(240,236,228,0.92)', margin: 0 }}>
              Get notified when it&apos;s your turn?
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(240,236,228,0.6)', margin: '2px 0 0' }}>
              We&apos;ll ping you when the game needs you.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(240,236,228,0.65)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '10px 14px',
                minHeight: '44px',
              }}
            >
              Not now
            </button>
            <button
              onClick={handleEnable}
              style={{
                background: 'var(--color-stage-gold)',
                color: '#120f08',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '10px 18px',
                minHeight: '44px',
              }}
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
