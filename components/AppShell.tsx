'use client'

import { usePathname } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomTabBar } from '@/components/BottomTabBar'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  const isGamePage = pathname.startsWith('/host') || pathname.startsWith('/join')
  const isAdminPage = pathname.startsWith('/admin')

  const showNav = !isAdminPage && !isGamePage

  return (
    <>
      {showNav && <TopBar />}
      <main style={{ paddingBottom: showNav && !isDesktop ? 72 : 0 }}>
        {children}
      </main>
      {showNav && !isDesktop && <BottomTabBar />}
    </>
  )
}
