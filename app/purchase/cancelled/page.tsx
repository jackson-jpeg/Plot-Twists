'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'

export default function PurchaseCancelledPage() {
  const router = useRouter()

  return (
    <main className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
      <div className="max-w-md w-full text-center">
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
              <button onClick={() => router.push('/')} className="w-full"
                style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Back to Home
              </button>
              <button
                onClick={() => router.back()}
                className="w-full"
                style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Try Again
              </button>
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
      </div>
    </main>
  )
}
