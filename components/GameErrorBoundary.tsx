'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  phaseName?: string
}

interface State {
  hasError: boolean
  resetKey: number
}

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, resetKey: prev.resetKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container max-w-lg text-center" style={{ paddingTop: '4rem' }}>
          <div className="card">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎭</div>
            <h2 className="text-2xl font-display mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Scene interrupted!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Something went wrong{this.props.phaseName ? ` during ${this.props.phaseName}` : ''}. Tap to retry.
            </p>
            <button onClick={this.handleRetry} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      )
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>
  }
}
