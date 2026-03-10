'use client'

import { ReactNode } from 'react'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={className} style={{ textAlign: align }}>
      <div
        className="flex items-center gap-2"
        style={{ justifyContent: align === 'center' ? 'center' : 'flex-start' }}
      >
        <h2
          className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)] leading-tight tracking-tight"
        >
          {title}
        </h2>
        {badge}
      </div>
      {subtitle && (
        <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1 font-[var(--font-body)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}
