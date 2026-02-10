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

const PACKAGE_ICONS: Record<string, string> = {
  starter: '🎟️',
  party: '🎉',
  pro: '🎬',
  studio: '🏛️',
}

const STUB_CLASSES: Record<string, string> = {
  starter: 'purchase-package-stub-starter',
  party: 'purchase-package-stub-party',
  pro: 'purchase-package-stub-pro',
  studio: 'purchase-package-stub-studio',
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

  const bestValueId = 'party'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="purchase-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="purchase-modal-container"
          >
            {/* Purple gradient header */}
            <div className="purchase-modal-header">
              <div className="purchase-modal-presents">Plot Twists Presents</div>
              <h2 className="purchase-modal-title">GET SCRIPTS</h2>
              <p className="purchase-modal-subtitle">Credits never expire. Use them whenever you want.</p>
            </div>

            {/* Ticket perforation */}
            <div className="purchase-modal-perforation" />

            {/* Body */}
            <div className="purchase-modal-body">
              {error && (
                <div className="purchase-modal-error">{error}</div>
              )}

              <div className="purchase-package-grid">
                {CREDIT_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    className={`purchase-package-card ${
                      pkg.id === bestValueId ? 'purchase-package-card-best' : ''
                    } ${loading && loading !== pkg.id ? 'purchase-package-card-dimmed' : ''}`}
                  >
                    {/* Best Value badge */}
                    {pkg.id === bestValueId && (
                      <div className="purchase-best-value-badge">Best Value!</div>
                    )}

                    {/* Colored stub top */}
                    <div className={`purchase-package-stub ${STUB_CLASSES[pkg.id] || ''}`}>
                      <span className="purchase-package-stub-icon">
                        {PACKAGE_ICONS[pkg.id] || '🎟️'}
                      </span>
                      <span className="purchase-package-stub-label">{pkg.label}</span>
                    </div>

                    {/* Dashed perforation with notch cutouts */}
                    <div className="purchase-package-perf" />

                    {/* Main body: price, scripts, per-script */}
                    <div className="purchase-package-main">
                      <div className="purchase-package-price">
                        ${(pkg.price / 100).toFixed(0)}
                      </div>
                      <div className="purchase-package-scripts">
                        {pkg.scripts} scripts
                      </div>
                      <div className="purchase-package-per-script">
                        ${(pkg.price / pkg.scripts / 100).toFixed(2)}/script
                      </div>

                      {loading === pkg.id && (
                        <div className="purchase-package-loading">Redirecting...</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={onClose} className="purchase-modal-close">
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
