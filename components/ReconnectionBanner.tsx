'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING } from '@/lib/motion'

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

  const config: Record<BannerState, { borderColor: string; textColor: string; dotColor: string; message: string }> = {
    reconnecting: {
      borderColor: 'rgba(212,175,55,0.3)',
      textColor: 'rgba(212,175,55,0.9)',
      dotColor: 'rgba(212,175,55,0.8)',
      message: `Reconnecting${attempt > 1 ? ` (attempt ${attempt})` : ''}...`,
    },
    reconnected: {
      borderColor: 'rgba(46,204,113,0.3)',
      textColor: 'rgba(46,204,113,0.9)',
      dotColor: 'rgba(46,204,113,0.8)',
      message: 'Reconnected!',
    },
    failed: {
      borderColor: 'rgba(231,76,60,0.3)',
      textColor: 'rgba(231,76,60,0.9)',
      dotColor: 'rgba(231,76,60,0.8)',
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
          transition={SPRING}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium font-display"
          style={{
            background: 'rgba(8,7,11,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${current.borderColor}`,
            color: current.textColor,
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
          }}
        >
          {current.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
