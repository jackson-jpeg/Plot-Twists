'use client'

import { useState, useEffect } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase'
import { getMissingFirebaseConfig } from '@/contexts/AuthContext'

/**
 * SystemStatus - Visible indicator when Firebase config is missing in production
 *
 * Only renders when:
 * - Running in production (NODE_ENV === 'production')
 * - Firebase is not configured (missing env vars)
 *
 * Shows a pulsing amber dot that expands on tap to show details.
 */
export function SystemStatus() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // Only check on client side and in production
    if (typeof window === 'undefined') return

    const isProduction = process.env.NODE_ENV === 'production'
    const configMissing = !isFirebaseConfigured

    if (isProduction && configMissing) {
      setShouldRender(true)
      setMissingVars(getMissingFirebaseConfig())
    }
  }, [])

  // Don't render anything if conditions aren't met
  if (!shouldRender) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9998,
        fontFamily: 'var(--font-ui)',
      }}
    >
      {isExpanded ? (
        // Expanded panel
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
          {/* Header with close button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-warning)',
                  animation: 'pulse-live 2s ease-in-out infinite',
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                }}
              >
                System Status
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '18px',
                lineHeight: 1,
                color: 'var(--color-text-tertiary)',
                borderRadius: 'var(--radius-sm)',
                minWidth: '28px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close status panel"
            >
              ×
            </button>
          </div>

          {/* Warning message */}
          <div
            style={{
              background: 'var(--color-warning-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
              }}
            >
              Auth Configuration Missing
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              Firebase is not configured. Users will be limited to Guest Mode.
            </div>
          </div>

          {/* Missing variables list */}
          {missingVars.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Missing Variables ({missingVars.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {missingVars.map((varName) => (
                  <code
                    key={varName}
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-script)',
                      background: 'var(--color-surface-alt)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {varName}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Admin note */}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border)',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.4,
            }}
          >
            Set these as Build Variables in Railway, then rebuild (clear cache).
          </div>
        </div>
      ) : (
        // Collapsed indicator - tap to expand
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--color-surface)',
            border: '2px solid var(--color-warning)',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-2)',
            cursor: 'pointer',
            transition: 'all var(--duration-fast) var(--easing-out)',
            minHeight: '44px',
            minWidth: '44px',
          }}
          aria-label="View system status - auth configuration missing"
          aria-expanded={false}
        >
          {/* Pulsing amber dot */}
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-warning)',
              animation: 'pulse-live 2s ease-in-out infinite',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Status
          </span>
        </button>
      )}
    </div>
  )
}
