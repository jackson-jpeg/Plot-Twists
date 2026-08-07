'use client'

import { ReactNode } from 'react'

export interface PageContainerProps {
  size?: 'narrow' | 'medium' | 'wide' | 'full'
  centered?: boolean
  theater?: boolean
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

const maxWidthMap = {
  narrow: '480px',
  medium: '720px',
  wide: '1000px',
  full: '100%',
} as const

export function PageContainer({
  size = 'medium',
  centered = false,
  theater = false,
  children,
  className = '',
  style,
}: PageContainerProps) {
  // A <div>, not <main>: AppShell already renders the page's one <main>
  // landmark, and this container nesting a second one inside it was a
  // duplicate-landmark axe violation on every consumer page.
  return (
    <div
      className={`${centered ? 'flex flex-col items-center justify-center' : ''} ${className}`}
      style={{
        minHeight: '100dvh',
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))',
        background: theater ? 'var(--color-theater-bg)' : 'var(--color-bg)',
        color: theater ? 'var(--color-theater-text)' : undefined,
        transition: 'background-color 600ms',
        ...style,
      }}
    >
      <div
        className="w-full mx-auto"
        style={{ maxWidth: maxWidthMap[size] }}
      >
        {children}
      </div>
    </div>
  )
}
