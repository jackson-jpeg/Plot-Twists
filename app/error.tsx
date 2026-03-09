'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Button, PageContainer } from '@/components/ui'

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
    <PageContainer size="narrow" centered>
      <div className="text-center">
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
          <Button variant="primary" onClick={reset}>Try Again</Button>
          <Button variant="secondary" onClick={() => { window.location.href = '/' }}>Go Home</Button>
        </div>
      </div>
    </PageContainer>
  )
}
