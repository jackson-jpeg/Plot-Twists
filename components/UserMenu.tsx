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
          className="user-menu-btn"
          style={{
            backgroundColor: '#f59e0b',
            color: '#000',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
          title="Firebase auth not configured - click for details"
        >
          Setup Incomplete
        </button>
        {showDebugInfo && (
          <div
            className="user-menu-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              padding: '1rem',
              minWidth: '280px',
              zIndex: 50,
            }}
          >
            <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '0.5rem' }}>
              Missing Environment Variables:
            </div>
            {missingVars.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                {missingVars.map((v) => (
                  <li key={v} style={{ marginBottom: '0.25rem' }}>{v}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                All env vars present but Firebase failed to initialize. Check console for errors.
              </div>
            )}
            <div style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.625rem' }}>
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
      <div className="user-menu" ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
