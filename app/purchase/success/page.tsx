'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getApiBaseUrl } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface SessionStatus {
  status: string
  paymentStatus: string
  packageId?: string
  scripts?: string
  amountTotal?: number
}

function PurchaseSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { getToken } = useAuth()
  const [session, setSession] = useState<SessionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setError('No session ID provided')
      return
    }

    async function fetchSession() {
      try {
        const token = await getToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`${getApiBaseUrl()}/api/stripe/session-status?session_id=${sessionId}`, { headers })
        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setSession(data)
        }
      } catch {
        setError('Failed to verify purchase')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [sessionId, getToken])

  const pkg = session?.packageId
    ? CREDIT_PACKAGES.find(p => p.id === session.packageId)
    : null
  const scripts = session?.scripts ? parseInt(session.scripts, 10) : pkg?.scripts || 0
  const amount = session?.amountTotal ? (session.amountTotal / 100).toFixed(2) : null

  return (
    <main className="page-container items-center justify-center">
      <div className="max-w-md w-full text-center">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block text-5xl mb-4"
            >
              🎬
            </motion.div>
            <p className="text-[var(--color-text-secondary)]">Verifying your purchase...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 shadow-sm"
          >
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold font-display mb-2 text-[var(--color-text-primary)]">
              Something went wrong
            </h1>
            <p className="mb-6 text-[var(--color-text-secondary)]">{error}</p>
            <button onClick={() => router.push('/')} className="btn btn-primary">
              Go Home
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={MOTION.gentle}
          >
            <motion.div
              className="text-7xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              🎉
            </motion.div>

            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 shadow-sm">
              <motion.h1
                className="text-3xl font-bold font-display mb-2 text-[var(--color-text-primary)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Purchase Complete!
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {pkg && (
                  <p className="text-lg font-semibold mb-1 text-[var(--color-accent)]">
                    {pkg.label}
                  </p>
                )}

                <div className="my-6 p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  <div className="text-5xl font-bold font-display mb-2 text-[var(--color-text-primary)]">
                    +{scripts}
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    script credit{scripts !== 1 ? 's' : ''} added to your account
                  </div>
                  {amount && (
                    <div className="text-sm mt-2 text-[var(--color-text-tertiary)]">
                      ${amount} charged
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button onClick={() => router.push('/')} className="btn btn-primary btn-large w-full">
                  Start Playing
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="btn btn-ghost w-full"
                >
                  View Profile
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <main className="page-container items-center justify-center">
        <div className="text-center">
          <div className="inline-block text-5xl mb-4 animate-spin">🎬</div>
          <p className="text-[var(--color-text-secondary)]">Verifying your purchase...</p>
        </div>
      </main>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  )
}
