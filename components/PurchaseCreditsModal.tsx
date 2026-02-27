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

const PACKAGE_META: Record<string, { tagline: string }> = {
  starter: { tagline: 'A taste of the show' },
  party:   { tagline: 'Grab some friends' },
  pro:     { tagline: 'Lights, camera, action' },
  studio:  { tagline: 'The full experience' },
}

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const { user, getToken } = useAuth()
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
        const result = await purchaseViaStoreKit(packageId, user!.uid, getToken)
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
      const headers = await getAuthHeaders(getToken)
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{
              maxWidth: showCheckout ? '560px' : '420px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full z-10"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {showCheckout ? (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                  className="p-5"
                >
                  {/* Back + package info */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1.5 text-sm font-medium mb-3"
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back
                    </button>
                    {selectedPkg && (
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                        <div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedPkg.label}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>{selectedPkg.scripts} scripts &middot; ${(selectedPkg.price / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Embedded Stripe checkout */}
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                    <EmbeddedCheckoutProvider
                      stripe={getStripePromise()}
                      options={{ clientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>

                  {/* Trust footer */}
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
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
                  <div className="text-center pt-6 pb-4 px-5">
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-disabled)', letterSpacing: '0.1em' }}>Plot Twists Presents</p>
                    <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>Script Credits</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Buy once, use anytime. Credits never expire.</p>
                  </div>

                  {/* Success */}
                  {successMessage && (
                    <motion.div
                      className="mx-5 mb-3 px-3 py-2 rounded-lg text-sm text-center"
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
                      className="mx-5 mb-3 px-3 py-2 rounded-lg text-sm text-center"
                      style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Package list */}
                  <div className="px-5 space-y-2">
                    {CREDIT_PACKAGES.map((pkg, i) => {
                      const meta = PACKAGE_META[pkg.id] || { tagline: '' }
                      const isBest = pkg.id === BEST_VALUE_ID
                      const perScript = (pkg.price / pkg.scripts / 100).toFixed(2)
                      const isLoading = loading === pkg.id
                      const isDimmed = loading !== null && !isLoading

                      return (
                        <motion.button
                          key={pkg.id}
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={loading !== null}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left relative"
                          style={{
                            background: isBest ? 'var(--color-accent-light)' : 'var(--color-surface-alt)',
                            border: isBest ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                            cursor: loading ? 'default' : 'pointer',
                            opacity: isDimmed ? 0.4 : 1,
                            transition: 'opacity 0.2s',
                          }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: isDimmed ? 0.4 : 1, x: 0 }}
                          transition={{ delay: i * 0.06 + 0.1 }}
                          whileHover={loading ? undefined : { x: 4 }}
                          whileTap={loading ? undefined : { scale: 0.985 }}
                        >
                          {isBest && (
                            <span
                              className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--color-accent)', color: '#fff' }}
                            >
                              Best Value
                            </span>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{pkg.label}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{meta.tagline}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{pkg.scripts} scripts</div>
                            <div className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>${perScript} each</div>
                          </div>

                          <div className="w-14 text-right shrink-0">
                            {isLoading ? (
                              <div
                                className="w-5 h-5 rounded-full border-2 ml-auto"
                                style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)', animation: 'spin 0.6s linear infinite' }}
                              />
                            ) : (
                              <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>${(pkg.price / 100).toFixed(0)}</span>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  <div className="text-center py-4 px-5">
                    <button
                      onClick={handleClose}
                      className="text-sm"
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
                    >
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
                        className="block mx-auto mt-1 text-xs"
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-disabled)', cursor: 'pointer' }}
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
