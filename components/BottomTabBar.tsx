'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { tapHaptic } from '@/hooks/useHaptics'

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/explore', label: 'Explore' },
  { href: '/profile', label: 'Profile' },
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

  if (loading || !user || !shouldShowTabBar(pathname)) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--color-surface)',
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
              onClick={() => { if (!isActive) tapHaptic() }}
              className="flex flex-col items-center justify-center flex-1 py-3 relative"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
                WebkitTapHighlightColor: 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 24, height: 2, background: 'var(--color-text-primary)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
