'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          fontFamily: "'Fredoka', 'DM Sans', system-ui, sans-serif",
          background: '#FFF8F0',
          color: '#2D2A26',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎭</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            Scene Interrupted!
          </h1>
          <p
            style={{
              color: '#6B6560',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}
          >
            Something unexpected happened backstage. Don&apos;t worry — every great show has a blooper reel.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                background: '#F59E42',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '12px 24px',
                background: '#F0EDE8',
                color: '#2D2A26',
                border: '1px solid #D9D4CE',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
