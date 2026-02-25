'use client'

import { useState, useEffect } from 'react'

/**
 * SystemStatus - Visible indicator when critical config is missing in production
 *
 * Only renders when:
 * - Running in production (NODE_ENV === 'production')
 * - Clerk is not configured (missing env vars)
 */
export function SystemStatus() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isProduction = process.env.NODE_ENV === 'production'
    const clerkMissing = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    if (isProduction && clerkMissing) {
      setShouldRender(true)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: 'calc(16px + env(safe-area-inset-left, 0px))',
        zIndex: 9998,
        fontFamily: 'var(--font-ui)',
      }}
    >
      {isExpanded ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '2px solid var(--color-warning)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-3)',
            padding: '16px',
            maxWidth: '300px',
            animation: 'fadeInUp var(--duration-fast) var(--easing-out)',
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: 'var(--color-warning)',
                  animation: 'pulse-live 2s ease-in-out infinite',
                }}
                aria-hidden="true"
              />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                System Status
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px', fontSize: '18px', lineHeight: 1,
                color: 'var(--color-text-tertiary)', borderRadius: 'var(--radius-sm)',
                minWidth: '28px', minHeight: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close status panel"
            >
              ×
            </button>
          </div>

          <div
            style={{
              background: 'var(--color-warning-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Auth Configuration Missing
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Clerk is not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            background: 'var(--color-surface)',
            border: '2px solid var(--color-warning)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-2)',
            cursor: 'pointer',
            transition: 'all var(--duration-fast) var(--easing-out)',
            minHeight: '44px', minWidth: '44px',
          }}
          aria-label="View system status - auth configuration missing"
          aria-expanded={false}
        >
          <span
            style={{
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: 'var(--color-warning)',
              animation: 'pulse-live 2s ease-in-out infinite',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Status
          </span>
        </button>
      )}
    </div>
  )
}
