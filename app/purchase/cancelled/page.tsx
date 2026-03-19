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
          <motion.div
            className="text-6xl mb-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
          >
            🎬
          </motion.div>

          <motion.div
            className="rounded-xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(240,236,228,0.12)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <motion.h1
              className="text-2xl font-bold font-display mb-3"
              style={{ color: '#f0ece4' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              No Charges Made
            </motion.h1>

            <motion.p
              className="mb-6"
              style={{ color: 'rgba(240,236,228,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your checkout was cancelled. You haven&apos;t been charged anything.
            </motion.p>

            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/')}>
                Back to Home
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={() => router.back()}>
                Try Again
              </Button>
            </motion.div>
          </motion.div>

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
