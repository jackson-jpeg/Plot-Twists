'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function PurchaseCancelledPage() {
  const router = useRouter()

  return (
    <main className="page-container items-center justify-center">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          <div className="text-6xl mb-6">🎬</div>

          <div className="polaroid-card p-8 relative">
            <div className="tape-piece tape-top-center" />

            <h1
              className="text-2xl font-bold font-display mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No Charges Made
            </h1>

            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Your checkout was cancelled. You haven&apos;t been charged anything.
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={() => router.push('/')} className="btn btn-primary w-full">
                Back to Home
              </button>
              <button
                onClick={() => router.back()}
                className="btn btn-ghost w-full"
              >
                Try Again
              </button>
            </div>
          </div>

          <motion.p
            className="mt-6 text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
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
