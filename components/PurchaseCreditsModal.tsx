'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getApiBaseUrl } from '@/lib/api'

interface PurchaseCreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

const BEST_VALUE_ID = 'studio'

const PACKAGE_META: Record<string, { icon: string; tagline: string }> = {
  starter: { icon: '🎟️', tagline: 'A taste of the show' },
  party:   { icon: '🍿', tagline: 'Grab some friends' },
  pro:     { icon: '🎬', tagline: 'Lights, camera, action' },
  studio:  { icon: '⭐', tagline: 'The full experience' },
}

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (packageId: string) => {
    if (!user) return
    setLoading(packageId)
    setError(null)

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId: user.uid })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
        setLoading(null)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="purchase-overlay"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
            className="purchase-container"
          >
            {/* Close button */}
            <button onClick={onClose} className="purchase-close-x" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            {/* Header */}
            <div className="purchase-header">
              <div className="purchase-film-strip" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="purchase-film-hole" />
                ))}
              </div>
              <p className="purchase-presents">Plot Twists Presents</p>
              <h2 className="purchase-title">Script Credits</h2>
              <p className="purchase-subtitle">Buy once, use anytime. Credits never expire.</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                className="purchase-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {error}
              </motion.div>
            )}

            {/* Package list */}
            <div className="purchase-packages">
              {CREDIT_PACKAGES.map((pkg, i) => {
                const meta = PACKAGE_META[pkg.id] || { icon: '🎟️', tagline: '' }
                const isBest = pkg.id === BEST_VALUE_ID
                const perScript = (pkg.price / pkg.scripts / 100).toFixed(2)
                const isLoading = loading === pkg.id
                const isDimmed = loading !== null && !isLoading

                return (
                  <motion.button
                    key={pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    className={`purchase-pkg ${isBest ? 'purchase-pkg-best' : ''} ${isDimmed ? 'purchase-pkg-dimmed' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1 }}
                    whileHover={loading ? undefined : { x: 4 }}
                    whileTap={loading ? undefined : { scale: 0.985 }}
                  >
                    {isBest && <div className="purchase-best-tag">Best Value</div>}

                    <div className="purchase-pkg-icon">{meta.icon}</div>

                    <div className="purchase-pkg-info">
                      <div className="purchase-pkg-name">{pkg.label}</div>
                      <div className="purchase-pkg-tagline">{meta.tagline}</div>
                    </div>

                    <div className="purchase-pkg-numbers">
                      <div className="purchase-pkg-scripts">{pkg.scripts} scripts</div>
                      <div className="purchase-pkg-per">${perScript} each</div>
                    </div>

                    <div className="purchase-pkg-price-col">
                      {isLoading ? (
                        <div className="purchase-pkg-spinner" />
                      ) : (
                        <div className="purchase-pkg-price">${(pkg.price / 100).toFixed(0)}</div>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="purchase-footer">
              <button onClick={onClose} className="purchase-dismiss">
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
