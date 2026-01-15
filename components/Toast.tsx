'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-accent-2)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="toast"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'var(--color-surface)',
        border: `2px solid ${colors[type]}`,
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 8px 24px rgba(42, 39, 34, 0.12)',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <div
        style={{
          fontSize: '24px',
          color: colors[type],
          fontWeight: 'bold'
        }}
      >
        {icons[type]}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          color: 'var(--color-text-primary)',
          margin: 0,
          fontSize: '14px',
          fontWeight: 500
        }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '0 4px',
          lineHeight: 1
        }}
      >
        ×
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ y: index * 80 }}
            animate={{ y: index * 80 }}
            style={{ position: 'absolute', bottom: 0, right: 0 }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => onRemove(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
