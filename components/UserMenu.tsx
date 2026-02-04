'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'

export function UserMenu() {
  const { user, loading, signOut, isConfigured } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
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

  // Not configured - don't show anything
  if (!isConfigured) {
    return null
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
      <div className="user-menu" ref={dropdownRef}>
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
    </>
  )
}
