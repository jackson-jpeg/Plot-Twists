'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ReactNode, useEffect, useRef, useCallback, useId } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  maxWidth?: string
}

export function Modal({ isOpen, onClose, children, title, maxWidth = '600px' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const shouldReduceMotion = useReducedMotion()

  // Handle Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Focus trap
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Store current active element and focus modal
      previousActiveElement.current = document.activeElement as HTMLElement
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keydown', handleFocusTrap)

      // Focus the modal or first focusable element
      setTimeout(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }, 0)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleFocusTrap)
      document.body.style.overflow = ''

      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, handleKeyDown, handleFocusTrap])

  if (!isOpen) return null

  const motionProps = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {}

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {/* Backdrop */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(42, 39, 34, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            background: 'var(--color-background)',
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(42, 39, 34, 0.2)',
            maxWidth,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          {...motionProps}
        >
          {/* Header */}
          {title && (
            <div
              style={{
                padding: '24px 24px 16px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)'
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '24px',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  transition: 'color 0.2s, background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                  e.currentTarget.style.background = 'var(--color-surface-alt)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-tertiary)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Body */}
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
