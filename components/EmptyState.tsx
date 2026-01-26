'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface EmptyStateProps {
  variant?: 'default' | 'games' | 'achievements' | 'history' | 'players' | 'search' | 'error'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

const illustrations = {
  default: {
    emoji: '📭',
    animation: { y: [0, -5, 0] },
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'This area is empty. Check back later!'
  },
  games: {
    emoji: '🎮',
    animation: { rotate: [-5, 5, -5], scale: [1, 1.05, 1] },
    defaultTitle: 'No games found',
    defaultDescription: 'Start a new game or join an existing one!'
  },
  achievements: {
    emoji: '🏆',
    animation: { y: [0, -8, 0], rotate: [0, 5, -5, 0] },
    defaultTitle: 'No achievements yet',
    defaultDescription: 'Play more games to unlock achievements!'
  },
  history: {
    emoji: '📜',
    animation: { rotateY: [0, 10, 0] },
    defaultTitle: 'No game history',
    defaultDescription: 'Your completed games will appear here.'
  },
  players: {
    emoji: '👥',
    animation: { scale: [1, 1.1, 1] },
    defaultTitle: 'Waiting for players',
    defaultDescription: 'Share the game code to invite friends!'
  },
  search: {
    emoji: '🔍',
    animation: { x: [-3, 3, -3], rotate: [-5, 5, -5] },
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search or filters.'
  },
  error: {
    emoji: '😵',
    animation: { rotate: [-10, 10, -10] },
    defaultTitle: 'Something went wrong',
    defaultDescription: 'Please try again or refresh the page.'
  }
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  action,
  className = '',
  children
}: EmptyStateProps) {
  const config = illustrations[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {/* Animated illustration */}
      <motion.div
        className="relative mb-6"
        animate={config.animation}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 blur-xl opacity-30 bg-purple-500 rounded-full scale-150" />

        {/* Main emoji */}
        <span className="relative text-7xl block">{config.emoji}</span>
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-xl font-semibold text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {title || config.defaultTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        className="text-gray-400 max-w-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {description || config.defaultDescription}
      </motion.p>

      {/* Action button */}
      {action && (
        <motion.button
          onClick={action.onClick}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}

      {/* Custom children */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}

// Skeleton loading placeholder
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card'
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className = ''
}: SkeletonProps) {
  const baseClasses = 'bg-gray-700 animate-pulse'

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-xl'
  }

  const style: React.CSSProperties = {
    width: width || (variant === 'circle' ? '48px' : '100%'),
    height: height || (variant === 'circle' ? '48px' : variant === 'text' ? '16px' : '100px')
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

// List skeleton for loading states
interface ListSkeletonProps {
  count?: number
  itemHeight?: number
  gap?: number
  className?: string
}

export function ListSkeleton({
  count = 3,
  itemHeight = 60,
  gap = 12,
  className = ''
}: ListSkeletonProps) {
  return (
    <div className={`space-y-${gap / 4} ${className}`} style={{ gap: `${gap}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3"
        >
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Card skeleton for loading game cards, etc.
interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-gray-800/50 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" height={12} />
            </div>
          </div>
          <Skeleton variant="rect" height={80} />
          <div className="flex gap-2">
            <Skeleton variant="rect" width={80} height={32} />
            <Skeleton variant="rect" width={80} height={32} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Stats skeleton for profile stats
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-gray-800/50 rounded-xl p-4 text-center"
        >
          <Skeleton variant="text" width="40%" height={32} className="mx-auto mb-2" />
          <Skeleton variant="text" width="60%" height={14} className="mx-auto" />
        </motion.div>
      ))}
    </div>
  )
}
