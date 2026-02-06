'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { CREDIT_PACKAGES } from '@/lib/credits'

interface PurchaseCreditsModalProps {
  isOpen: boolean
  onClose: () => void
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
      const res = await fetch('/api/stripe/create-checkout-session', {
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '0.25rem'
              }}>
                Get More Scripts
              </h2>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)'
              }}>
                Credits never expire. Use them whenever you want.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: 'var(--color-danger, #f87171)20',
                borderRadius: '0.5rem',
                color: 'var(--color-danger, #f87171)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {CREDIT_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  style={{
                    position: 'relative',
                    background: 'var(--color-background)',
                    border: pkg.id === bestValueId
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem 0.75rem',
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading && loading !== pkg.id ? 0.5 : 1,
                    textAlign: 'center',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  }}
                >
                  {pkg.id === bestValueId && (
                    <div style={{
                      position: 'absolute',
                      top: '-0.5rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Best Value
                    </div>
                  )}

                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: '0.25rem'
                  }}>
                    {pkg.label}
                  </div>

                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    marginBottom: '0.25rem'
                  }}>
                    ${(pkg.price / 100).toFixed(0)}
                  </div>

                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {pkg.scripts} scripts
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.25rem'
                  }}>
                    ${(pkg.price / pkg.scripts / 100).toFixed(2)}/script
                  </div>

                  {loading === pkg.id && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)'
                    }}>
                      Redirecting...
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                display: 'block',
                margin: '1rem auto 0',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
