'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { tapHaptic } from '@/hooks/useHaptics'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V10.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  )
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
    </svg>
  )
}

function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" fill="currentColor" fillOpacity={active ? 1 : 0.6} />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const TABS = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/play', label: 'Play', Icon: PlayIcon },
  { href: '/explore', label: 'Explore', Icon: ExploreIcon },
  { href: '/profile', label: 'Profile', Icon: ProfileIcon },
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
            <motion.div key={tab.href} whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
              <Link
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => { if (!isActive) tapHaptic() }}
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
                <tab.Icon active={isActive} />
                <span
                  className="mt-0.5 font-medium"
                  style={{
                    fontSize: '11px',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-disabled)',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
