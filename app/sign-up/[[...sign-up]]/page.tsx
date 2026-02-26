'use client'

import { SignUp } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MOTION } from '@/lib/animations'

export default function SignUpPage() {
  const router = useRouter()

  return (
    <main className="page-container items-center justify-center">
      <div className="container max-w-md">
        <motion.button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>←</span> Back to Home
        </motion.button>

        <motion.div
          initial={{ y: -30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={MOTION.gentle}
          className="rounded-2xl overflow-hidden"
          style={{ border: '2px solid var(--color-purple-border)', boxShadow: '0 20px 60px -12px rgba(168, 85, 247, 0.25)' }}
        >
          {/* Ticket Header */}
          <div
            className="text-center py-6 px-4 relative"
            style={{ background: 'linear-gradient(135deg, var(--color-purple-deeper), var(--color-purple-dark))' }}
          >
            <div className="text-4xl mb-2">🎭</div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide mb-1">JOIN THE SHOW</h1>
            <p className="font-script text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>5 free scripts every week</p>
          </div>

          {/* Perforation */}
          <div className="ticket-perforation" />

          {/* Clerk Form */}
          <div className="p-4" style={{ background: 'var(--color-surface)' }}>
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  cardBox: 'w-full shadow-none',
                  card: 'bg-transparent shadow-none p-0',
                },
              }}
            />
          </div>
        </motion.div>
      </div>
    </main>
  )
}
