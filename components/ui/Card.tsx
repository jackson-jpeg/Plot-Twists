'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { MOTION } from '@/lib/animations'

export interface CardProps {
  variant?: 'surface' | 'elevated' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

const paddingMap = {
  none: '0px',
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-5)',
} as const

export function Card({
  variant = 'surface',
  padding = 'md',
  children,
  onClick,
  className = '',
  style,
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    borderRadius: 'var(--radius-card)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    ...(variant === 'elevated' && {
      boxShadow: 'var(--shadow-2)',
    }),
    ...(onClick && {
      cursor: 'pointer',
    }),
    ...style,
  }

  if (variant === 'interactive') {
    return (
      <motion.div
        className={className}
        style={{ ...baseStyle, cursor: 'pointer' }}
        onClick={onClick}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-3)' }}
        whileTap={{ scale: 0.98 }}
        transition={MOTION.snappy}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={className} style={baseStyle} onClick={onClick}>
      {children}
    </div>
  )
}
