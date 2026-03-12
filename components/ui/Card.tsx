'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { SPRING } from '@/lib/motion'

export interface CardProps {
  variant?: 'surface' | 'elevated' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const

export function Card({
  variant = 'surface',
  padding = 'md',
  children,
  onClick,
  className = '',
  style,
}: CardProps) {
  const base = `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl ${paddingClasses[padding]}`

  if (variant === 'interactive') {
    return (
      <motion.div
        className={`${base} cursor-pointer shadow-sm ${className}`}
        style={style}
        onClick={onClick}
        whileHover={{ boxShadow: 'var(--shadow-2)', borderColor: 'var(--color-border-strong)' }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      className={`${base} ${variant === 'elevated' ? 'shadow-sm' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
