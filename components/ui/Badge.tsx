'use client'

import { ReactNode } from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'accent' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantClasses = {
  default: 'bg-[var(--color-surface-inset)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]',
  danger: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
} as const

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  style,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold whitespace-nowrap
        ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'}
        ${variantClasses[variant]}
        ${className}
      `}
      style={style}
    >
      {children}
    </span>
  )
}
