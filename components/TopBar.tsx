'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/join', label: 'Join' },
  { href: '/explore', label: 'Scripts' },
  { href: '/profile', label: 'Profile' },
]

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <header className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(8,7,11,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
      <div className="flex items-center justify-between px-5 mx-auto"
        style={{ maxWidth: 960, height: 52 }}>
        <Link href="/"
          className="transition-opacity duration-150 hover:opacity-80"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(240,236,228,0.6)',
            textDecoration: 'none',
            letterSpacing: '0.03em',
          }}>
          PlotSlop
        </Link>

        {isDesktop && (
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`font-medium no-underline transition-colors duration-150 ${
                  pathname === item.href
                    ? 'text-[rgba(240,236,228,0.8)]'
                    : 'text-[rgba(240,236,228,0.25)] hover:text-[rgba(240,236,228,0.5)]'
                }`}
                style={{ fontSize: 13 }}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <Link href="/join"
          className="no-underline text-[rgba(240,236,228,0.4)] border border-[rgba(255,255,255,0.08)] rounded-full transition-all duration-150 hover:border-[rgba(255,255,255,0.18)] hover:text-[rgba(240,236,228,0.6)]"
          style={{
            fontSize: 12,
            padding: '5px 14px',
          }}>
          Join Game
        </Link>
      </div>
    </header>
  )
}
