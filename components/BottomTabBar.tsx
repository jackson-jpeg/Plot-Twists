'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { useAuth } from '@/contexts/AuthContext'
import { tapHaptic } from '@/hooks/useHaptics'

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/host', label: 'Host' },
  { href: '/join', label: 'Join' },
  { href: '/profile', label: 'Profile' },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,7,11,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
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
                color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
                WebkitTapHighlightColor: 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                transition: 'color 0.2s ease',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 24, height: 2, background: 'var(--color-stage-gold)' }}
                  transition={SPRING}
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
