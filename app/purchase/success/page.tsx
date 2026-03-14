'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SPRING_GENTLE } from '@/lib/motion'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getApiBaseUrl } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button, PageContainer } from '@/components/ui'

interface SessionStatus {
  status: string
  paymentStatus: string
  packageId?: string
  scripts?: string
  amountTotal?: number
}

const DARK_CARD = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(240,236,228,0.12)',
} as const

const DARK_INSET = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(240,236,228,0.08)',
} as const

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
    <PageContainer size="narrow" centered style={{ background: 'var(--color-void, #08070b)' }}>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block text-5xl mb-4"
            >
              🎬
            </motion.div>
            <p style={{ color: 'rgba(240,236,228,0.5)' }}>Verifying your purchase...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-8"
            style={DARK_CARD}
          >
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-2xl font-bold font-display mb-2" style={{ color: '#f0ece4' }}>
              Something went wrong
            </h1>
            <p className="mb-6" style={{ color: 'rgba(240,236,228,0.6)' }}>{error}</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_GENTLE}
          >
            <motion.div
              className="text-7xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              🎉
            </motion.div>

            <div className="rounded-xl p-8" style={DARK_CARD}>
              <motion.h1
                className="text-3xl font-bold font-display mb-2"
                style={{ color: '#f0ece4' }}
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
                  <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>
                    {pkg.label}
                  </p>
                )}

                <div className="my-6 p-6 rounded-xl" style={DARK_INSET}>
                  <div className="text-5xl font-bold font-display mb-2" style={{ color: '#f0ece4' }}>
                    +{scripts}
                  </div>
                  <div style={{ color: 'rgba(240,236,228,0.6)' }}>
                    script credit{scripts !== 1 ? 's' : ''} added to your account
                  </div>
                  {amount && (
                    <div className="text-sm mt-2" style={{ color: 'rgba(240,236,228,0.4)' }}>
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
                <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/')}>
                  Start Playing
                </Button>
                <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/profile')}>
                  View Profile
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
    </PageContainer>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <PageContainer size="narrow" centered style={{ background: 'var(--color-void, #08070b)' }}>
        <div className="text-center">
          <div className="inline-block text-5xl mb-4 animate-spin">🎬</div>
          <p style={{ color: 'rgba(240,236,228,0.5)' }}>Verifying your purchase...</p>
        </div>
      </PageContainer>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  )
}
