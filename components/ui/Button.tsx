'use client'

import { motion } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { MOTION, BUTTON } from '@/lib/animations'

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

const sizeStyles = {
  sm: {
    padding: '8px 16px',
    fontSize: '13px',
    gap: '6px',
  },
  md: {
    padding: '12px 24px',
    fontSize: '15px',
    gap: '8px',
  },
  lg: {
    padding: '16px 24px',
    fontSize: '17px',
    gap: '10px',
  },
} as const

const variantStyles = {
  primary: {
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'white',
    border: 'none',
  },
} as const

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
  const sizeS = sizeStyles[size]
  const variantS = variantStyles[variant]

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizeS.gap,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: sizeS.fontSize,
        padding: sizeS.padding,
        borderRadius: 'var(--radius-button)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background 0.2s, opacity 0.2s, border-color 0.2s',
        ...variantS,
        ...style,
      }}
      whileHover={isDisabled ? undefined : BUTTON.hover}
      whileTap={isDisabled ? undefined : BUTTON.tap}
      transition={MOTION.snappy}
    >
      {loading ? (
        <span
          style={{
            width: size === 'sm' ? '14px' : '18px',
            height: size === 'sm' ? '14px' : '18px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>
      )}
    </motion.button>
  )
})
