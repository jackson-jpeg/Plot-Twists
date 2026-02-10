'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth, getMissingFirebaseConfig } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { CreditBadge, CreditHeaderBadge } from './CreditBadge'
import { PurchaseCreditsModal } from './PurchaseCreditsModal'

export function UserMenu() {
  const { user, loading, signOut, isConfigured } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
  const [showDebugInfo, setShowDebugInfo] = useState(false)
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

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
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
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return '?'
  }

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className="user-menu">
        <div className="user-menu-avatar user-menu-avatar-skeleton" />
      </div>
    )
  }

  // Not configured - hide debug UI in production, show in development only
  if (!isConfigured) {
    // In production, just return null to hide the debug UI entirely
    if (process.env.NODE_ENV === 'production') {
      return null
    }

    const missingVars = getMissingFirebaseConfig()
    return (
      <div className="user-menu" ref={dropdownRef}>
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="user-menu-btn bg-[var(--color-warning)] text-black px-4 py-2 rounded-lg text-xs font-semibold"
          title="Firebase auth not configured - click for details"
        >
          Setup Incomplete
        </button>
        {showDebugInfo && (
          <div className="user-menu-dropdown absolute top-full right-0 mt-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg p-4 min-w-[280px] z-50">
            <div className="text-[var(--color-warning)] font-semibold mb-2">
              Missing Environment Variables:
            </div>
            {missingVars.length > 0 ? (
              <ul className="m-0 pl-5 text-[var(--color-text-tertiary)] text-xs">
                {missingVars.map((v) => (
                  <li key={v} className="mb-1">{v}</li>
                ))}
              </ul>
            ) : (
              <div className="text-[var(--color-text-tertiary)] text-xs">
                All env vars present but Firebase failed to initialize. Check console for errors.
              </div>
            )}
            <div className="mt-3 text-[var(--color-text-disabled)] text-[10px]">
              Add these to .env.local and restart the dev server.
            </div>
          </div>
        )}
      </div>
    )
  }

  // Guest/Anonymous user - show sign in/up buttons
  if (!user || user.isAnonymous) {
    return (
      <>
        <div className="user-menu">
          <button
            onClick={() => openAuthModal('signin')}
            className="user-menu-btn user-menu-btn-secondary"
          >
            Log In
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="user-menu-btn user-menu-btn-primary"
          >
            Sign Up
          </button>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    )
  }

  // Authenticated user - show avatar dropdown
  return (
    <>
      <div className="user-menu flex items-center gap-2" ref={dropdownRef}>
        <CreditHeaderBadge onClick={() => setShowPurchaseModal(true)} />
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="user-menu-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} />
            ) : (
              getInitials()
            )}
          </div>
          <span className="user-menu-name">
            {user.displayName || 'User'}
          </span>
          <span className={`user-menu-chevron ${isOpen ? 'user-menu-chevron-open' : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="user-menu-dropdown">
            {user.email && (
              <div className="user-menu-dropdown-header">
                <div className="user-menu-dropdown-email">{user.email}</div>
              </div>
            )}
            <CreditBadge onClick={() => { setIsOpen(false); setShowPurchaseModal(true) }} />
            <Link
              href="/profile"
              className="user-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="user-menu-item-icon">👤</span>
              Profile
            </Link>
            <button
              className="user-menu-item user-menu-item-danger"
              onClick={handleSignOut}
            >
              <span className="user-menu-item-icon">🚪</span>
              Log Out
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  )
}
