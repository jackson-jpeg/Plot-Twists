'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignInButton } from '@clerk/nextjs'
import { CreditBadge, CreditHeaderBadge } from './CreditBadge'
import dynamic from 'next/dynamic'
const PurchaseCreditsModal = dynamic(() => import('./PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false, loading: () => null })

export function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return '?'
  }

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} />
      </div>
    )
  }

  // Guest/Anonymous user - show sign in button
  if (!user) {
    return (
      <div className="flex items-center">
        <SignInButton mode="redirect">
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Sign In
          </button>
        </SignInButton>
      </div>
    )
  }

  // Authenticated user - show avatar dropdown
  return (
    <>
      <div className="flex items-center gap-2" ref={dropdownRef} style={{ position: 'relative' }}>
        <CreditHeaderBadge onClick={() => setShowPurchaseModal(true)} />
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="User menu"
          className="flex items-center gap-2"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(to bottom right, var(--color-purple), var(--color-pink))',
              color: 'white',
              border: '2px solid var(--color-border)',
            }}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Player'} width={32} height={32} className="rounded-full" />
            ) : (
              getInitials()
            )}
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--color-text-primary)' }}>
            {user.displayName || user.email?.split('@')[0] || 'Player'}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ color: 'var(--color-text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              minWidth: '200px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-3)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            {(user.phoneNumber || user.email) && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{user.email || user.phoneNumber}</div>
              </div>
            )}
            <CreditBadge onClick={() => { setIsOpen(false); setShowPurchaseModal(true) }} />
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2"
              style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'background 0.15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-tertiary)' }}><circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full text-left"
              style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-danger)', background: 'none', border: 'none', borderTop: '1px solid var(--color-border)', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-danger)' }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Log Out
            </button>
          </div>
        )}
      </div>

      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  )
}
