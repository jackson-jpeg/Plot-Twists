'use client'

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useState, ReactNode, useRef, MouseEvent } from 'react'

// Ripple effect button
interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

interface Ripple {
  x: number
  y: number
  id: number
}

export function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md'
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { x, y, id }])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id))
    }, 600)

    onClick?.()
  }

  const variantStyles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-lg font-semibold
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </motion.button>
  )
}

// Bouncy card with tilt effect
interface TiltCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function TiltCard({ children, className = '', onClick, disabled }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [10, -10])
  const rotateY = useTransform(x, [-100, 100], [-10, 10])

  const springConfig = { stiffness: 300, damping: 30 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 1000
      }}
      className={`
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Magnetic button that follows cursor
interface MagneticButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  strength?: number
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  strength = 0.3
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className={className}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}

// Pulse animation wrapper
interface PulseProps {
  children: ReactNode
  active?: boolean
  color?: string
  className?: string
}

export function Pulse({ children, active = true, color = 'purple', className = '' }: PulseProps) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      {active && (
        <>
          <span
            className={`absolute inset-0 rounded-full ${colorMap[color]} opacity-75 animate-ping`}
          />
          <span
            className={`absolute inset-0 rounded-full ${colorMap[color]} opacity-50`}
            style={{
              animation: 'pulse-ring 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite'
            }}
          />
        </>
      )}
      <span className="relative">{children}</span>
    </div>
  )
}

// Glow button
interface GlowButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  glowColor?: string
  disabled?: boolean
}

export function GlowButton({
  children,
  onClick,
  className = '',
  glowColor = 'purple',
  disabled = false
}: GlowButtonProps) {
  const glowColors: Record<string, string> = {
    purple: 'shadow-purple-500/50 hover:shadow-purple-500/70',
    blue: 'shadow-blue-500/50 hover:shadow-blue-500/70',
    green: 'shadow-green-500/50 hover:shadow-green-500/70',
    pink: 'shadow-pink-500/50 hover:shadow-pink-500/70',
    orange: 'shadow-orange-500/50 hover:shadow-orange-500/70'
  }

  const bgColors: Record<string, string> = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    pink: 'bg-pink-600 hover:bg-pink-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-xl font-semibold text-white
        shadow-lg transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${bgColors[glowColor]}
        ${disabled ? '' : glowColors[glowColor]}
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.05, boxShadow: '0 20px 40px -10px currentColor' }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}

// Shake animation for errors
interface ShakeProps {
  children: ReactNode
  trigger?: boolean
  className?: string
}

export function Shake({ children, trigger = false, className = '' }: ShakeProps) {
  return (
    <motion.div
      animate={trigger ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Success checkmark animation
interface SuccessCheckProps {
  show: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SuccessCheck({ show, size = 'md', className = '' }: SuccessCheckProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  if (!show) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`${sizes[size]} ${className}`}
    >
      <motion.svg
        viewBox="0 0 50 50"
        className="w-full h-full"
      >
        <motion.circle
          cx="25"
          cy="25"
          r="22"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M14 26 L22 34 L36 18"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.div>
  )
}

// Confetti explosion
interface ConfettiProps {
  trigger: boolean
  count?: number
}

export function Confetti({ trigger, count = 50 }: ConfettiProps) {
  if (!trigger) return null

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400,
    y: -Math.random() * 300 - 100,
    rotation: Math.random() * 720,
    color: ['#F59E42', '#A855F7', '#EC4899', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)]
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: particle.color, left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            rotate: particle.rotation,
            opacity: 0
          }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

// Count up animation
interface CountUpProps {
  from?: number
  to: number
  duration?: number
  className?: string
  format?: (value: number) => string
}

export function CountUp({
  from = 0,
  to,
  duration = 1,
  className = '',
  format = (v) => Math.round(v).toString()
}: CountUpProps) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, latest => format(latest))
  const springCount = useSpring(count, { duration: duration * 1000 })

  // Animate to target
  springCount.set(to)

  return <motion.span className={className}>{rounded}</motion.span>
}
