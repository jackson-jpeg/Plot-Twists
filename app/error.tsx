'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-surface)]">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <svg width="64" height="64" viewBox="0 0 28 28" fill="none"><circle cx="10" cy="12" r="7" stroke="var(--color-text-tertiary)" strokeWidth="2" /><circle cx="7.5" cy="11" r="1" fill="var(--color-text-tertiary)" /><circle cx="12.5" cy="11" r="1" fill="var(--color-text-tertiary)" /><path d="M7.5 14.5c1.5 1.5 3.5 1.5 5 0" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" /><circle cx="18" cy="14" r="7" stroke="var(--color-text-tertiary)" strokeWidth="2" /><circle cx="15.5" cy="13" r="1" fill="var(--color-text-tertiary)" /><circle cx="20.5" cy="13" r="1" fill="var(--color-text-tertiary)" /><path d="M15.5 16.5c1.5 1 3.5 1 5 0" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <h1 className="text-3xl font-display font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Scene Interrupted!
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Something unexpected happened backstage. Don&apos;t worry — every great show has a blooper reel.
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
