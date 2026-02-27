'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Play page error:', error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-surface)]">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🎭</div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-3">
          Curtain Call Error!
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Couldn&apos;t load the game browser. The show must go on — give it another try.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 font-semibold inline-flex items-center justify-center"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '15px', textDecoration: 'none' }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
