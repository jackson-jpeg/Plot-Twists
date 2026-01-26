'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'theater' | 'script'
  text?: string
  className?: string
}

const sizes = {
  sm: { container: 'w-6 h-6', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-16 h-16', text: 'text-lg' },
  xl: { container: 'w-24 h-24', text: 'text-xl' }
}

export function LoadingSpinner({
  size = 'md',
  variant = 'theater',
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = sizes[size]

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className={`${sizeClasses.container} relative`}>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        {text && <p className={`${sizeClasses.text} text-gray-500 dark:text-gray-400`}>{text}</p>}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-[var(--color-accent)]"
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
        {text && <p className={`${sizeClasses.text} text-gray-500 dark:text-gray-400`}>{text}</p>}
      </div>
    )
  }

  if (variant === 'script') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="relative">
          {/* Typewriter cursor animation */}
          <motion.div
            className="flex items-center gap-1"
          >
            <span className="text-4xl">📝</span>
            <motion.div
              className="w-0.5 h-8 bg-[var(--color-accent)]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </motion.div>
        </div>
        {text && (
          <motion.p
            className={`${sizeClasses.text} text-gray-600 dark:text-gray-300 font-medium`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }

  // Theater variant (default) - animated masks
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative flex items-center">
        <motion.span
          className="text-4xl"
          animate={{ rotate: [-5, 5, -5], y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎭
        </motion.span>
      </div>
      {text && (
        <p className={`${sizeClasses.text} text-gray-600 dark:text-gray-300`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Full-page loading overlay
export function LoadingOverlay({
  text = 'Loading...',
  variant = 'theater'
}: {
  text?: string
  variant?: 'spinner' | 'dots' | 'theater' | 'script'
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl"
      >
        <LoadingSpinner size="lg" variant={variant} text={text} />
      </motion.div>
    </motion.div>
  )
}

// Inline loading button state
export function LoadingButton({
  loading,
  children,
  loadingText = 'Loading...',
  className = '',
  disabled,
  ...props
}: {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`relative ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          <span>{loadingText}</span>
        </span>
      )}
    </button>
  )
}
