'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'

interface CreditBalanceState {
  free: number
  banked: number
  total: number
}

/** Shared hook so header badge + dropdown badge share the same live data */
export function useCreditBalance() {
  const { socket, isConnected } = useSocket()
  const [balance, setBalance] = useState<CreditBalanceState | null>(null)

  const fetchBalance = useCallback(() => {
    if (!socket || !isConnected) return
    socket.emit('get_credit_balance', (response) => {
      if (response.success && response.balance) {
        setBalance(response.balance)
      }
    })
  }, [socket, isConnected])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Listen for real-time balance updates
  useEffect(() => {
    if (!socket) return
    const handler = (b: CreditBalanceState) => setBalance(b)
    socket.on('credit_balance', handler)
    return () => { socket.off('credit_balance', handler) }
  }, [socket])

  return balance
}

/** Compact header pill — always visible next to the avatar */
export function CreditHeaderBadge({ onClick }: { onClick?: () => void }) {
  const balance = useCreditBalance()

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: onClick ? 'pointer' : 'default',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    transition: 'background 0.15s',
  }

  if (!balance) {
    return (
      <button onClick={onClick} style={pillStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-accent)' }}>
          <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M2 8h20M7 4v4M12 4v4M17 4v4" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>...</span>
      </button>
    )
  }

  let dotColor: string
  if (balance.total === 0) {
    dotColor = 'var(--color-danger)'
  } else if (balance.free > 0) {
    dotColor = 'var(--color-success)'
  } else {
    dotColor = 'var(--color-accent)'
  }

  return (
    <button
      onClick={onClick}
      title={`${balance.free} free + ${balance.banked} banked scripts`}
      aria-label={`${balance.total} scripts available: ${balance.free} free + ${balance.banked} banked`}
      style={pillStyle}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span>{balance.total}</span>
    </button>
  )
}

/** Dropdown row — detailed credit info inside the user menu */
export function CreditBadge({ onClick }: { onClick?: () => void }) {
  const balance = useCreditBalance()

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    cursor: onClick ? 'pointer' : 'default',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.15s',
  }

  if (!balance) {
    return (
      <div style={{ ...rowStyle, color: 'var(--color-text-disabled)' }}>
        Loading credits...
      </div>
    )
  }

  let dotColor: string
  let label: string

  if (balance.free > 0) {
    dotColor = 'var(--color-success)'
    label = `${balance.free} free script${balance.free !== 1 ? 's' : ''} left`
  } else if (balance.banked > 0) {
    dotColor = 'var(--color-accent)'
    label = `${balance.banked} banked script${balance.banked !== 1 ? 's' : ''}`
  } else {
    dotColor = 'var(--color-danger)'
    label = '0 scripts — buy more'
  }

  return (
    <button
      onClick={onClick}
      style={rowStyle}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span>{label}</span>
    </button>
  )
}
