'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'
import { Button, PageContainer } from '@/components/ui'

export default function PurchaseCancelledPage() {
  const router = useRouter()

  return (
    <PageContainer size="narrow" centered>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={MOTION.gentle}
        >
          <div className="text-6xl mb-6">🎬</div>

          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 shadow-sm">
            <h1 className="text-2xl font-bold font-display mb-3 text-[var(--color-text-primary)]">
              No Charges Made
            </h1>

            <p className="mb-6 text-[var(--color-text-secondary)]">
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
            className="mt-6 text-sm text-[var(--color-text-tertiary)]"
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
