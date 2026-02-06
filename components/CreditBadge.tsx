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
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>🎬</span>
        <span>...</span>
      </button>
    )
  }

  let pillColor: string
  let pillBg: string
  let label: string

  if (balance.total === 0) {
    pillColor = '#f87171'
    pillBg = 'rgba(248,113,113,0.15)'
    label = '0'
  } else if (balance.free > 0) {
    pillColor = '#4ade80'
    pillBg = 'rgba(74,222,128,0.15)'
    label = String(balance.total)
  } else {
    pillColor = '#facc15'
    pillBg = 'rgba(250,204,21,0.15)'
    label = String(balance.total)
  }

  return (
    <button
      onClick={onClick}
      title={`${balance.free} free + ${balance.banked} banked scripts`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.65rem',
        borderRadius: '999px',
        border: `1px solid ${pillColor}40`,
        background: pillBg,
        backdropFilter: 'blur(8px)',
        color: pillColor,
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>🎬</span>
      <span>{label}</span>
    </button>
  )
}

/** Dropdown row — detailed credit info inside the user menu */
export function CreditBadge({ onClick }: { onClick?: () => void }) {
  const balance = useCreditBalance()

  if (!balance) {
    return (
      <div style={{
        padding: '0.5rem 0.75rem',
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)',
        opacity: 0.5
      }}>
        Loading credits...
      </div>
    )
  }

  let dotColor: string
  let label: string

  if (balance.free > 0) {
    dotColor = 'var(--color-success, #4ade80)'
    label = `${balance.free} free script${balance.free !== 1 ? 's' : ''} left`
  } else if (balance.banked > 0) {
    dotColor = '#facc15'
    label = `${balance.banked} banked script${balance.banked !== 1 ? 's' : ''}`
  } else {
    dotColor = 'var(--color-danger, #f87171)'
    label = '0 scripts — buy more'
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        color: 'var(--color-text-secondary)',
        fontSize: '0.8rem',
        width: '100%',
        textAlign: 'left'
      }}
    >
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: dotColor,
        flexShrink: 0
      }} />
      <span>{label}</span>
    </button>
  )
}
