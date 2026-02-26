'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Profile page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface)]">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">👤</div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-3">
          Dressing Room Locked!
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Couldn&apos;t load your profile. Try again or head back to the main stage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn btn-primary px-6 py-3 font-semibold"
          >
            Try Again
          </button>
          <a
            href="/"
            className="btn btn-secondary px-6 py-3 font-semibold inline-flex items-center justify-center"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
