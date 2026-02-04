'use client'

import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastProps {
  id: string
  message: string
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  duration?: number
  action?: ToastAction
  showProgress?: boolean
}

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

// Use design tokens for warm palette
const typeColors = {
  success: {
    border: 'var(--color-success)',
    bg: 'var(--color-success-light)',
    icon: 'var(--color-success)',
    progress: 'var(--color-success)'
  },
  error: {
    border: 'var(--color-danger)',
    bg: 'var(--color-danger-light)',
    icon: 'var(--color-danger)',
    progress: 'var(--color-danger)'
  },
  warning: {
    border: 'var(--color-warning)',
    bg: 'var(--color-warning-light)',
    icon: 'var(--color-warning)',
    progress: 'var(--color-warning)'
  },
  info: {
    border: 'var(--color-accent-2)',
    bg: 'var(--color-accent-2-light)',
    icon: 'var(--color-accent-2)',
    progress: 'var(--color-accent-2)'
  }
}

export function Toast({
  id,
  message,
  title,
  type = 'info',
  onClose,
  duration = 5000,
  action,
  showProgress = true
}: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0])
  const shouldReduceMotion = useReducedMotion()

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (duration <= 0 || isPaused) return

    const startTime = Date.now()
    const endTime = startTime + duration

    const updateProgress = () => {
      const now = Date.now()
      const remaining = endTime - now
      const newProgress = (remaining / duration) * 100

      if (newProgress <= 0) {
        onClose()
      } else {
        setProgress(newProgress)
        requestAnimationFrame(updateProgress)
      }
    }

    const animationFrame = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationFrame)
  }, [duration, onClose, isPaused])

  const handleDragEnd = (_: never, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
      onClose()
    }
  }

  const colors = typeColors[type]

  return (
    <motion.div
      key={id}
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: shouldReduceMotion ? 0 : 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      style={{
        x,
        opacity,
        border: `1px solid var(--glass-border)`,
        borderLeft: `4px solid ${colors.border}`
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className="relative overflow-hidden w-full sm:w-auto sm:min-w-[320px] sm:max-w-[420px] bg-[var(--color-surface)] backdrop-blur-lg rounded-lg shadow-2xl cursor-grab active:cursor-grabbing touch-pan-y"
    >
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <motion.div
          className="absolute top-0 left-0 h-1"
          style={{ background: colors.progress }}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className="text-xl font-bold flex-shrink-0 mt-0.5"
          style={{ color: colors.icon }}
          aria-hidden="true"
        >
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
          )}
          <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--color-text-secondary)' }}>
            {message}
          </p>

          {/* Action button */}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                onClose()
              }}
              className="mt-2 text-sm font-medium hover:underline"
              style={{ color: colors.icon }}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button - 44px touch target */}
        <button
          onClick={onClose}
          className="flex-shrink-0 transition-colors flex items-center justify-center"
          style={{
            color: 'var(--color-text-tertiary)',
            minWidth: '44px',
            minHeight: '44px',
            marginRight: '-8px',
            marginTop: '-8px',
            borderRadius: 'var(--radius-md)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
          aria-label="Dismiss notification"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      </div>

      {/* Swipe hint on mobile */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 sm:hidden">
        <div className="w-8 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
      </div>
    </motion.div>
  )
}

// Toast data type for the container
export interface ToastData {
  id: string
  message: string
  title?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: ToastAction
}

interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
  maxVisible?: number
}

const positionStyles = {
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center'
}

const mobilePositionStyles = {
  'top-right': 'sm:top-4 sm:right-4 sm:left-auto sm:translate-x-0 top-0 left-0 right-0',
  'top-center': 'sm:top-4 sm:left-1/2 sm:-translate-x-1/2 top-0 left-0 right-0',
  'bottom-right': 'sm:bottom-4 sm:right-4 sm:left-auto sm:translate-x-0 bottom-0 left-0 right-0',
  'bottom-center': 'sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 bottom-0 left-0 right-0'
}

export function ToastContainer({
  toasts,
  onRemove,
  position = 'bottom-right',
  maxVisible = 5
}: ToastContainerProps) {
  const visibleToasts = toasts.slice(-maxVisible)
  const hiddenCount = toasts.length - maxVisible

  return (
    <div
      className={`
        fixed z-[9999] flex flex-col gap-2 p-2 sm:p-0
        ${mobilePositionStyles[position]}
        sm:${positionStyles[position]}
        pointer-events-none
      `}
    >
      <AnimatePresence mode="popLayout">
        {hiddenCount > 0 && (
          <motion.div
            key="hidden-count"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center text-[var(--color-text-tertiary)] text-xs py-1 pointer-events-auto"
          >
            +{hiddenCount} more notification{hiddenCount > 1 ? 's' : ''}
          </motion.div>
        )}

        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              title={toast.title}
              type={toast.type}
              duration={toast.duration}
              action={toast.action}
              onClose={() => onRemove(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Compact inline toast for specific areas
interface InlineToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose?: () => void
  className?: string
}

export function InlineToast({ message, type = 'info', onClose, className = '' }: InlineToastProps) {
  const colors = typeColors[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`flex items-center gap-2 p-3 rounded-lg ${className}`}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`
      }}
    >
      <span className="font-bold" style={{ color: colors.icon }} aria-hidden="true">{icons[type]}</span>
      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="transition-colors flex items-center justify-center"
          style={{
            color: 'var(--color-text-tertiary)',
            minWidth: '44px',
            minHeight: '44px',
            marginRight: '-8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
        >
          ×
        </button>
      )}
    </motion.div>
  )
}
