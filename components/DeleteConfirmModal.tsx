'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SPRING } from '@/lib/motion'

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        style={{ padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.target === e.currentTarget && !isDeleting && onCancel()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={SPRING}
          className="bg-[var(--color-surface)] rounded-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            {/* Warning icon */}
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-danger-light)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING, delay: 0.1 }}
            >
              <span className="text-3xl">⚠️</span>
            </motion.div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>

            {/* Message */}
            <p className="text-[var(--color-text-secondary)] text-center mb-2">
              {message}
            </p>

            {/* Item name if provided */}
            {itemName && (
              <p className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-[var(--color-surface-alt)] rounded-lg text-[var(--color-text-primary)] font-medium">
                  {itemName}
                </span>
              </p>
            )}

            <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--color-danger)' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
