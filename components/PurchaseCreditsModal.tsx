'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useAuth } from '@/contexts/AuthContext'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getApiBaseUrl } from '@/lib/api'
import { getStripePromise } from '@/lib/stripe'
import { analytics } from '@/lib/analytics'
import { isIOSNative } from '@/lib/platform'
import { purchaseViaStoreKit } from '@/lib/purchases'
import { successHaptic } from '@/hooks/useHaptics'
import { getAuthHeaders } from '@/lib/authHeaders'

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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [restoringPurchases, setRestoringPurchases] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePurchase = async (packageId: string) => {
    if (!user) return
    setLoading(packageId)
    setError(null)
    setSuccessMessage(null)
    analytics.purchaseInitiated(packageId)

    // iOS native → StoreKit flow
    if (isIOSNative()) {
      try {
        const result = await purchaseViaStoreKit(packageId, user.uid)
        if (result.success) {
          successHaptic()
          const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
          showSuccess(`${pkg?.scripts ?? result.credits ?? ''} credits added!`)
          setTimeout(() => onClose(), 1500)
        } else {
          const msg = result.error || 'Purchase failed'
          setError(msg)
          analytics.purchaseFailed(packageId, msg)
        }
      } catch {
        setError('Something went wrong. Please try again.')
        analytics.purchaseFailed(packageId, 'storekit_exception')
      } finally {
        setLoading(null)
      }
      return
    }

    // Web → Stripe flow
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ packageId })
      })

      const data = await res.json()
      if (data.clientSecret) {
        setSelectedPkgId(packageId)
        setClientSecret(data.clientSecret)
        setLoading(null)
      } else {
        const msg = data.error || 'Failed to start checkout'
        setError(msg)
        analytics.purchaseFailed(packageId, msg)
        setLoading(null)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      analytics.purchaseFailed(packageId, 'checkout_exception')
      setLoading(null)
    }
  }

  const handleBack = useCallback(() => {
    setClientSecret(null)
    setSelectedPkgId(null)
  }, [])

  const handleClose = useCallback(() => {
    setClientSecret(null)
    setSelectedPkgId(null)
    setLoading(null)
    setError(null)
    setSuccessMessage(null)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    onClose()
  }, [onClose])

  const selectedPkg = selectedPkgId ? CREDIT_PACKAGES.find(p => p.id === selectedPkgId) : null
  const showCheckout = !!clientSecret

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="purchase-overlay"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
            className={`purchase-container ${showCheckout ? 'purchase-container-wide' : ''}`}
          >
            {/* Close button */}
            <button onClick={handleClose} className="purchase-close-x" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {showCheckout ? (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Branded checkout header */}
                  <div className="purchase-checkout-header">
                    <button onClick={handleBack} className="purchase-back-btn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back
                    </button>
                    {selectedPkg && (
                      <div className="purchase-checkout-pkg">
                        <span className="purchase-checkout-icon">{PACKAGE_META[selectedPkg.id]?.icon}</span>
                        <div className="purchase-checkout-details">
                          <span className="purchase-checkout-name">{selectedPkg.label}</span>
                          <span className="purchase-checkout-meta">{selectedPkg.scripts} scripts &middot; ${(selectedPkg.price / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Embedded Stripe checkout */}
                  <div className="purchase-checkout-body">
                    <EmbeddedCheckoutProvider
                      stripe={getStripePromise()}
                      options={{ clientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>

                  {/* Trust footer */}
                  <div className="purchase-checkout-footer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Secure checkout powered by Stripe
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="packages"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                >
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

                  {/* Success */}
                  {successMessage && (
                    <motion.div
                      className="purchase-error"
                      style={{ background: 'var(--color-success)', color: 'white' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {successMessage}
                    </motion.div>
                  )}

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
                    <button onClick={handleClose} className="purchase-dismiss">
                      Maybe later
                    </button>
                    {isIOSNative() && (
                      <button
                        onClick={async () => {
                          setRestoringPurchases(true)
                          setError(null)
                          try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ;(window as any).webkit?.messageHandlers?.storeKit?.postMessage({ action: 'restore' })
                            showSuccess('Purchases restored successfully')
                          } catch {
                            setError('Could not restore purchases')
                          }
                          setRestoringPurchases(false)
                        }}
                        disabled={restoringPurchases}
                        className="purchase-dismiss"
                        style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}
                      >
                        {restoringPurchases ? 'Restoring...' : 'Restore Purchases'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
