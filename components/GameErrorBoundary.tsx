'use client'
import React from 'react'

interface Props { children: React.ReactNode; phaseName?: string }
interface State { hasError: boolean; key: number }

export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, key: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, key: prev.key + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Scene interrupted!
          </h2>
          {this.props.phaseName && (
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Something went wrong during {this.props.phaseName}.
            </p>
          )}
          <button className="btn btn-primary" onClick={this.handleRetry}>
            Try Again
          </button>
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
