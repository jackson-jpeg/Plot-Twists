'use client'

import { ReactNode } from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'accent' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantStyles = {
  default: {
    background: 'var(--color-surface-alt)',
    color: 'var(--color-text-secondary)',
  },
  success: {
    background: 'var(--color-success-light)',
    color: 'var(--color-success)',
  },
  warning: {
    background: 'var(--color-warning-light)',
    color: 'var(--color-warning)',
  },
  accent: {
    background: 'var(--color-accent-light)',
    color: 'var(--color-accent-dark)',
  },
  danger: {
    background: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
  },
} as const

const sizeStyles = {
  sm: {
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '6px',
  },
  md: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '8px',
  },
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
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
