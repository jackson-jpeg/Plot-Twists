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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: '8px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-title)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        {badge}
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--color-text-tertiary)',
            marginTop: '4px',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
