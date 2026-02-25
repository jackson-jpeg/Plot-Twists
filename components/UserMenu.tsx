'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SignInButton } from '@clerk/nextjs'
import { CreditBadge, CreditHeaderBadge } from './CreditBadge'
import dynamic from 'next/dynamic'
const PurchaseCreditsModal = dynamic(() => import('./PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false })

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
    if (user?.phoneNumber) {
      return '📱'
    }
    return '🎭'
  }

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className="user-menu">
        <div className="user-menu-avatar user-menu-avatar-skeleton" />
      </div>
    )
  }

  // Guest/Anonymous user - show sign in button
  if (!user) {
    return (
      <div className="user-menu">
        <SignInButton mode="redirect">
          <button className="user-menu-btn user-menu-btn-primary">
            Sign In
          </button>
        </SignInButton>
      </div>
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
            {(user.phoneNumber || user.email) && (
              <div className="user-menu-dropdown-header">
                <div className="user-menu-dropdown-email">{user.email || user.phoneNumber}</div>
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

      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  )
}
