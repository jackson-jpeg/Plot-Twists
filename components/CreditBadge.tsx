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

  if (!balance) {
    return (
      <button onClick={onClick} className="credit-header-badge">
        <span className="credit-header-badge-icon">🎬</span>
        <span>...</span>
      </button>
    )
  }

  let variant: string
  if (balance.total === 0) {
    variant = 'credit-header-badge-empty'
  } else if (balance.free > 0) {
    variant = 'credit-header-badge-ok'
  } else {
    variant = 'credit-header-badge-low'
  }

  return (
    <button
      onClick={onClick}
      title={`${balance.free} free + ${balance.banked} banked scripts`}
      aria-label={`${balance.total} scripts available: ${balance.free} free + ${balance.banked} banked`}
      className={`credit-header-badge ${variant}`}
    >
      <span className="credit-header-badge-icon" aria-hidden="true">🎬</span>
      <span>{balance.total}</span>
    </button>
  )
}

/** Dropdown row — detailed credit info inside the user menu */
export function CreditBadge({ onClick }: { onClick?: () => void }) {
  const balance = useCreditBalance()

  if (!balance) {
    return (
      <div className="credit-dropdown-row credit-dropdown-row-loading">
        Loading credits...
      </div>
    )
  }

  let dotClass: string
  let label: string

  if (balance.free > 0) {
    dotClass = 'credit-dot-ok'
    label = `${balance.free} free script${balance.free !== 1 ? 's' : ''} left`
  } else if (balance.banked > 0) {
    dotClass = 'credit-dot-low'
    label = `${balance.banked} banked script${balance.banked !== 1 ? 's' : ''}`
  } else {
    dotClass = 'credit-dot-empty'
    label = '0 scripts — buy more'
  }

  return (
    <button
      onClick={onClick}
      className="credit-dropdown-row"
      data-clickable={onClick ? 'true' : 'false'}
    >
      <span className={`credit-dot ${dotClass}`} />
      <span>{label}</span>
    </button>
  )
}
