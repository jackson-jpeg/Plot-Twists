'use client'

import { motion } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
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
    sm: 'h-9 px-4 text-[13px] gap-1.5',
    md: 'h-11 px-6 text-[15px] gap-2',
    lg: 'h-[52px] px-6 text-[17px] gap-2.5',
  } as const

  const variantClasses = {
    primary: 'bg-[var(--color-accent)] text-white border-0',
    secondary: 'bg-transparent text-[var(--color-text-primary)] border-[1.5px] border-[var(--color-border-strong)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] border-0',
    danger: 'bg-[var(--color-danger)] text-white border-0',
  } as const

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-[var(--font-display)] font-semibold
        rounded-[14px] cursor-pointer
        transition-colors duration-150
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={style}
      whileTap={isDisabled ? undefined : PRESS.whileTap}
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
