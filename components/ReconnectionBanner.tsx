'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOTION } from '@/lib/animations'

type BannerState = 'reconnecting' | 'reconnected' | 'failed'

interface ReconnectionBannerProps {
  reconnecting: boolean
  attempt?: number
  maxAttempts?: number
}

export function ReconnectionBanner({ reconnecting, attempt = 0, maxAttempts = 50 }: ReconnectionBannerProps) {
  const [bannerState, setBannerState] = useState<BannerState>('reconnecting')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (reconnecting) {
      setBannerState(attempt >= maxAttempts ? 'failed' : 'reconnecting')
      setShowSuccess(false)
    } else if (bannerState === 'reconnecting') {
      // Was reconnecting, now connected — show success briefly
      setBannerState('reconnected')
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [reconnecting, attempt, maxAttempts, bannerState])

  const visible = reconnecting || showSuccess

  const config: Record<BannerState, { bg: string; text: string; message: string }> = {
    reconnecting: {
      bg: 'var(--color-warning)',
      text: '#000',
      message: `Reconnecting${attempt > 1 ? ` (attempt ${attempt})` : ''}...`,
    },
    reconnected: {
      bg: 'var(--color-success)',
      text: '#fff',
      message: 'Reconnected!',
    },
    failed: {
      bg: 'var(--color-danger)',
      text: '#fff',
      message: 'Connection lost. Please refresh the page.',
    },
  }

  const current = config[bannerState]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={MOTION.snappy}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium font-display"
          style={{
            background: current.bg,
            color: current.text,
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          {current.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
