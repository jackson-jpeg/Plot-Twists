'use client'

import { motion } from 'framer-motion'
import { type CSSProperties, type ReactNode } from 'react'
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
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-7',
} as const

export function Card({
  variant = 'surface',
  padding = 'md',
  children,
  onClick,
  className = '',
  style,
}: CardProps) {
  const base = `border rounded-[24px] ${paddingClasses[padding]}`
  const surfaceStyle: CSSProperties = {
    background: 'var(--gradient-panel)',
    borderColor: 'var(--color-border)',
    boxShadow: 'var(--shadow-1)',
    backdropFilter: 'blur(16px)',
  }

  if (variant === 'interactive') {
    return (
      <motion.div
        className={`${base} cursor-pointer ${className}`}
        style={{ ...surfaceStyle, ...style }}
        onClick={onClick}
        whileHover={{ boxShadow: 'var(--shadow-3)', borderColor: 'var(--color-border-strong)', y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      className={`${base} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        ...surfaceStyle,
        ...(variant === 'elevated'
          ? { boxShadow: 'var(--shadow-2)' }
          : undefined),
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
