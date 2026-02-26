'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

const TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/play', label: 'Play', icon: '🎮' },
  { href: '/explore', label: 'Explore', icon: '🎴' },
  { href: '/profile', label: 'Profile', icon: '👤' },
] as const

/** Pages where the tab bar should be visible */
const TAB_PAGES = new Set(['/', '/play', '/explore', '/profile'])

function shouldShowTabBar(pathname: string): boolean {
  if (TAB_PAGES.has(pathname)) return true
  if (pathname.startsWith('/replay/')) return true
  return false
}

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Hide during auth loading, when logged out, or on non-tab pages
  if (loading || !user || !shouldShowTabBar(pathname)) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[48px] relative"
              style={{
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--color-accent)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-xl leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              <span
                className="text-[10px] mt-0.5 font-medium"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-disabled)',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
