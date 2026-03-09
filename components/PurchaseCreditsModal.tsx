'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOTION, STAGGER } from '@/lib/animations'
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
import { Button } from '@/components/ui'

interface PurchaseCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance?: number
}

const BEST_VALUE_ID = 'studio'

export function PurchaseCreditsModal({ isOpen, onClose, currentBalance }: PurchaseCreditsModalProps) {
  const { user, getToken } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedPkgId, setSelectedPkgId] = useState<string>(BEST_VALUE_ID)
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
  }, [])

  const handleClose = useCallback(() => {
    setClientSecret(null)
    setSelectedPkgId(BEST_VALUE_ID)
    setLoading(null)
    setError(null)
    setSuccessMessage(null)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    onClose()
  }, [onClose])

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selectedPkgId)
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={MOTION.spring}
            onClick={e => e.stopPropagation()}
            className="relative w-full overflow-hidden sm:rounded-2xl rounded-t-2xl"
            style={{
              maxWidth: showCheckout ? '560px' : '420px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--color-bg)',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
            }}
          >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    className="mb-3"
                    style={{ padding: 0 }}
                  >
                    Back
                  </Button>
                  {selectedPkg && (
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedPkg.label}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{selectedPkg.scripts} scripts &middot; ${(selectedPkg.price / 100).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                    <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ clientSecret }}>
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
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
                  <div className="flex items-center justify-between px-5 pt-6 pb-2">
                    <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Get credits
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', background: 'var(--color-surface-alt)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </Button>
                  </div>

                  {/* Current balance */}
                  {currentBalance !== undefined && (
                    <div className="text-center py-4">
                      <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Current balance</p>
                      <div className="flex items-baseline justify-center gap-1.5 mt-1">
                        <span className="font-display" style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                          {currentBalance}
                        </span>
                        <span style={{ fontSize: '18px', color: 'var(--color-text-tertiary)' }}>credits</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '4px' }}>
                        1 credit = 1 script generation
                      </p>
                    </div>
                  )}

                  {/* Messages */}
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

                  {/* Package tiers */}
                  <div className="px-5 space-y-3">
                    {CREDIT_PACKAGES.map((pkg, i) => {
                      const isSelected = selectedPkgId === pkg.id
                      const isBest = pkg.id === BEST_VALUE_ID
                      const perScript = (pkg.price / pkg.scripts / 100).toFixed(2)

                      return (
                        <motion.button
                          key={pkg.id}
                          onClick={() => setSelectedPkgId(pkg.id)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl text-left relative"
                          style={{
                            background: isSelected ? 'var(--color-accent-light, rgba(245,158,66,0.08))' : 'var(--color-surface)',
                            border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                            cursor: 'pointer',
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * STAGGER.fast + 0.1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isBest && (
                            <span
                              className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                              style={{ background: 'var(--color-accent)', color: 'white', fontSize: '10px', letterSpacing: '0.05em' }}
                            >
                              Best Value
                            </span>
                          )}

                          {/* Circle badge */}
                          <div
                            className="flex items-center justify-center rounded-xl shrink-0"
                            style={{
                              width: 48,
                              height: 48,
                              background: isSelected ? 'var(--color-accent)' : 'var(--color-surface-alt)',
                              color: isSelected ? 'white' : 'var(--color-text-secondary)',
                              fontSize: '18px',
                              fontWeight: 700,
                              borderRadius: '12px',
                            }}
                          >
                            {pkg.scripts}
                          </div>

                          {/* Label + per-script */}
                          <div className="flex-1 min-w-0">
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {pkg.scripts} credits
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                              ${perScript} per script
                            </div>
                          </div>

                          {/* Price */}
                          <div className="shrink-0">
                            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              ${(pkg.price / 100).toFixed(2)}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Free credits info */}
                  <div
                    className="mx-5 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--color-success-light, rgba(16,185,129,0.08))' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-success)', flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 5.5V10l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>5 free credits weekly</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Resets every Monday</p>
                    </div>
                  </div>

                  {/* Purchase CTA */}
                  <div className="px-5 pt-6 pb-3">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={loading !== null}
                      disabled={!selectedPkg}
                      onClick={() => selectedPkg && handlePurchase(selectedPkg.id)}
                    >
                      {selectedPkg
                        ? `Purchase ${selectedPkg.scripts} credits — $${(selectedPkg.price / 100).toFixed(2)}`
                        : 'Select a package'
                      }
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="text-center pb-5 px-5">
                    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                      One-time purchase. No subscription.
                    </p>
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
                        className="mt-2 text-xs"
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
