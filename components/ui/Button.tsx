'use client'

import { motion } from 'framer-motion'
import { type CSSProperties, type ReactNode, forwardRef } from 'react'
import { SPRING, PRESS } from '@/lib/motion'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
    iconRight,
    children,
    onClick,
    type = 'button',
    className = '',
    style,
  },
  ref
) {
  const isDisabled = disabled || loading

  const sizeClasses = {
    sm: 'min-h-10 px-4 text-[12px] gap-1.5',
    md: 'min-h-12 px-6 text-[14px] gap-2',
    lg: 'min-h-[56px] px-7 text-[16px] gap-2.5',
  } as const

  const variantClasses = {
    primary: 'text-white border-[1.5px] border-[rgba(255,255,255,0.14)]',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[1.5px] border-[var(--color-border-strong)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] border-[1px] border-transparent',
    danger: 'text-white border-[1.5px] border-[rgba(255,255,255,0.14)]',
  } as const

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, var(--color-accent) 0%, #ff7d3f 100%)',
      boxShadow: '0 16px 36px rgba(255, 90, 54, 0.26)',
    },
    secondary: {
      background: 'var(--gradient-panel)',
      boxShadow: 'var(--shadow-1)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.04)',
    },
    danger: {
      background: 'linear-gradient(135deg, var(--color-danger) 0%, #ff7a7a 100%)',
      boxShadow: '0 16px 36px rgba(215, 59, 59, 0.22)',
    },
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-[var(--font-display)] uppercase
        rounded-[18px] cursor-pointer
        transition-transform duration-150
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        letterSpacing: '0.04em',
        ...variantStyles[variant],
        ...style,
      }}
      whileTap={isDisabled ? undefined : PRESS.whileTap}
      whileHover={isDisabled ? undefined : { y: -2, scale: 1.01 }}
      transition={SPRING}
    >
      {loading ? (
        <span
          className="border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          style={{
            width: size === 'sm' ? 14 : 18,
            height: size === 'sm' ? 14 : 18,
          }}
        />
      ) : icon ? (
        <span className="flex items-center shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="flex items-center shrink-0">{iconRight}</span>
      )}
    </motion.button>
  )
})
