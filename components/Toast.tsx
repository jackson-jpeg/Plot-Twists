'use client'

import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion'
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

const typeStyles = {
  success: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    icon: 'text-green-500',
    progress: 'bg-green-500'
  },
  error: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    icon: 'text-red-500',
    progress: 'bg-red-500'
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-500',
    progress: 'bg-yellow-500'
  },
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    progress: 'bg-blue-500'
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

  const styles = typeStyles[type]

  return (
    <motion.div
      key={id}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`
        relative overflow-hidden
        w-full sm:w-auto sm:min-w-[320px] sm:max-w-[420px]
        bg-gray-900/95 backdrop-blur-lg
        border-l-4 ${styles.border}
        rounded-lg shadow-2xl
        cursor-grab active:cursor-grabbing
        touch-pan-y
      `}
    >
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <motion.div
          className={`absolute top-0 left-0 h-1 ${styles.progress}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`text-xl font-bold ${styles.icon} flex-shrink-0 mt-0.5`}>
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-white text-sm mb-0.5">{title}</p>
          )}
          <p className="text-gray-300 text-sm leading-relaxed break-words">
            {message}
          </p>

          {/* Action button */}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                onClose()
              }}
              className={`mt-2 text-sm font-medium ${styles.icon} hover:underline`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xl leading-none p-1 -mr-1 -mt-1 flex-shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Swipe hint on mobile */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 sm:hidden">
        <div className="w-8 h-1 bg-gray-700 rounded-full" />
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
            className="text-center text-gray-500 text-xs py-1 pointer-events-auto"
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
  const styles = typeStyles[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        flex items-center gap-2 p-3 rounded-lg
        ${styles.bg} ${styles.border} border
        ${className}
      `}
    >
      <span className={`${styles.icon} font-bold`}>{icons[type]}</span>
      <span className="text-sm text-white flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      )}
    </motion.div>
  )
}
