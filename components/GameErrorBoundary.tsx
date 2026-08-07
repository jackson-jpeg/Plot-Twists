'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { EASE_CAMERA, DUR } from '@/lib/motion'

interface Props { children: React.ReactNode; phaseName?: string }
interface State { hasError: boolean; key: number; retryCount: number }

export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, key: 0, retryCount: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[GameErrorBoundary] ${this.props.phaseName || 'unknown'}:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, key: prev.key + 1, retryCount: prev.retryCount + 1 }))
  }

  handleGoHome = () => {
    // Deliberate full reload: after a render crash the client state is
    // suspect, and a class component has no useRouter. A hard reset is the
    // recovery, not a nicety.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const showHomeOption = this.state.retryCount >= 1
      // Dropped-scene title card: this fallback renders inside the theater
      // (dark game phases), so it lives in the ink world — the old version
      // floated a light-mode surface card with a bouncing emoji.
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DUR.slower, ease: EASE_CAMERA }}
          style={{
            textAlign: 'center',
            padding: '40px 28px',
            background: 'var(--color-ink)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
          role="alert"
        >
          <p
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              // Lightened stage red: the token value is 3.6:1 on ink at 9px
              color: '#e57358',
              margin: '0 0 14px',
            }}
          >
            Technical difficulties
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '26px',
              fontWeight: 400,
              lineHeight: 1.15,
              color: 'rgba(240,236,228,0.94)',
              margin: '0 0 10px',
            }}
          >
            We lost the plot.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'rgba(240,236,228,0.55)',
              margin: '0 0 24px',
            }}
          >
            {this.props.phaseName
              ? `Something broke during ${this.props.phaseName}. The scene can be retaken.`
              : 'Something broke mid-scene. It can be retaken.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'var(--color-stage-red)',
                color: '#fff',
                padding: '11px 26px',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Retake the scene
            </button>
            {showHomeOption && (
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'transparent',
                  color: 'rgba(240,236,228,0.75)',
                  padding: '11px 26px',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.16)',
                  cursor: 'pointer',
                }}
              >
                Leave the theater
              </button>
            )}
          </div>
        </motion.div>
      )
    }
    return (
      <React.Fragment key={this.state.key}>
        {this.props.children}
      </React.Fragment>
    )
  }
}
