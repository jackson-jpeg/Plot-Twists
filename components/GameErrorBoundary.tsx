'use client'
import React from 'react'

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
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const showHomeOption = this.state.retryCount >= 1
      return (
        <div className="rounded-xl" style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Scene interrupted!
          </h2>
          {this.props.phaseName && (
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Something went wrong during {this.props.phaseName}.
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{ background: 'var(--color-accent)', color: 'white', padding: '10px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Try Again
            </button>
            {showHomeOption && (
              <button
                onClick={this.handleGoHome}
                style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '10px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      )
    }
    return (
      <React.Fragment key={this.state.key}>
        {this.props.children}
      </React.Fragment>
    )
  }
}
