'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SPRING_GENTLE } from '@/lib/motion'
import { Button, PageContainer } from '@/components/ui'

export default function PurchaseCancelledPage() {
  const router = useRouter()

  return (
    <PageContainer size="narrow" centered style={{ background: 'var(--color-void, #08070b)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_GENTLE}
        >
          <div className="text-6xl mb-6">🎬</div>

          <div
            className="rounded-xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(240,236,228,0.12)',
            }}
          >
            <h1 className="text-2xl font-bold font-display mb-3" style={{ color: '#f0ece4' }}>
              No Charges Made
            </h1>

            <p className="mb-6" style={{ color: 'rgba(240,236,228,0.6)' }}>
              Your checkout was cancelled. You haven&apos;t been charged anything.
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/')}>
                Back to Home
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => router.back()}>
                Try Again
              </Button>
            </div>
          </div>

          <motion.p
            className="mt-6 text-sm text-center"
            style={{ color: 'rgba(240,236,228,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            You still have your free weekly credits available!
          </motion.p>
        </motion.div>
    </PageContainer>
  )
}
