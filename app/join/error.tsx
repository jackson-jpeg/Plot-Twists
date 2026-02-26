'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function JoinError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Join page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface)]">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🎟️</div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-3">
          Lost Your Ticket!
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Something went wrong joining the show. Try again or head back to find a new game.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn btn-primary px-6 py-3 font-semibold"
          >
            Try Again
          </button>
          <a
            href="/play"
            className="btn btn-secondary px-6 py-3 font-semibold inline-flex items-center justify-center"
          >
            Find a Game
          </a>
        </div>
      </div>
    </div>
  )
}
