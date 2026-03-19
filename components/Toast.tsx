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
  duration = 3000,
  action,
  showProgress = true
}: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0])
  const shouldReduceMotion = useReducedMotion()

  const isCompact = !title && !action

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
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
      onClose()
    }
  }

  const colors = typeColors[type]

  return (
    <motion.div
      key={id}
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: shouldReduceMotion ? 0 : 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`
        relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing touch-pan-y
        ${isCompact ? 'backdrop-blur-md' : 'backdrop-blur-lg'}
      `}
      style={{
        x, opacity,
        background: 'var(--color-surface)',
        border: `1px solid var(--glass-border)`,
        ...(!isCompact && { borderLeft: `3px solid ${colors.border}` }),
        boxShadow: 'var(--shadow-3, 0 4px 20px rgba(0,0,0,0.15))',
      }}
    >
      {/* Progress bar — only on longer toasts */}
      {showProgress && duration > 2500 && (
        <motion.div
          className="absolute top-0 left-0 h-0.5"
          style={{ background: colors.progress }}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      <div className={`flex items-center gap-2.5 ${isCompact ? 'px-3.5 py-2.5' : 'p-3.5'}`}>
        {/* Icon */}
        <motion.div
          className={`font-bold flex-shrink-0 flex items-center justify-center rounded-full ${isCompact ? 'text-xs w-5 h-5' : 'text-sm w-6 h-6'}`}
          style={{ color: colors.icon, background: colors.bg }}
          aria-hidden="true"
          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
        >
          {icons[type]}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
          )}
          <p className={`leading-snug break-words ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
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

        {/* Close button — only on non-compact or error toasts */}
        {(!isCompact || type === 'error') && (
          <button
            onClick={onClose}
            className="flex-shrink-0 transition-colors flex items-center justify-center rounded-full"
            style={{
              color: 'var(--color-text-tertiary)',
              width: '28px',
              height: '28px',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
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

export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-center',
  maxVisible = 3
}: ToastContainerProps) {
  const visibleToasts = toasts.slice(-maxVisible)
  const hiddenCount = toasts.length - maxVisible

  return (
    <div
      className="fixed z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{
        top: 'env(safe-area-inset-top, 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 24px), 380px)',
        paddingTop: '12px',
      }}
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
            +{hiddenCount} more
          </motion.div>
        )}

        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
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
      <motion.span
        className="font-bold"
        style={{ color: colors.icon }}
        aria-hidden="true"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
      >
        {icons[type]}
      </motion.span>
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
