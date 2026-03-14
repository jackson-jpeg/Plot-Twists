'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/join', label: 'Join' },
  { href: '/explore', label: 'Explore' },
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
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}>
      <div className="flex items-center justify-between px-5 mx-auto"
        style={{ maxWidth: 960, height: 52 }}>
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}>
          Plot Twists
        </Link>

        {isDesktop && (
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="text-sm font-medium transition-colors"
                style={{
                  color: pathname === item.href
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                }}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <Link href="/profile">
          <Avatar name={user?.displayName || '?'} size="sm" />
        </Link>
      </div>
    </header>
  )
}
