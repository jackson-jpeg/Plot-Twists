'use client'

import { motion } from 'framer-motion'

interface MoviePosterFrameProps {
  imageUrl: string
  title?: string
  onClick?: () => void
  maxWidth?: number
  showNowShowing?: boolean
  variant?: 'performance' | 'results' | 'lightbox'
}

export function MoviePosterFrame({
  imageUrl,
  title,
  onClick,
  maxWidth = 320,
  showNowShowing = false,
  variant = 'performance'
}: MoviePosterFrameProps) {
  if (variant === 'lightbox') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img
          src={imageUrl}
          alt={`${title ?? 'Movie'} Poster`}
          className="movie-poster-frame"
          style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>
    )
  }

  return (
    <motion.div
      className="mx-auto mb-6 flex flex-col items-center"
      initial={variant === 'results' ? { rotateY: 90, opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={variant === 'results' ? { rotateY: 0, opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={variant === 'results'
        ? { delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        : { duration: 0.5 }
      }
      style={variant === 'results' ? { perspective: 1000 } : undefined}
    >
      <motion.div
        onClick={onClick}
        className="movie-poster-frame"
        style={{ maxWidth, position: 'relative' }}
        whileHover={onClick ? { scale: 1.03 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {showNowShowing && (
          <div className="movie-poster-ribbon">NOW SHOWING</div>
        )}
        <img
          src={imageUrl}
          alt={`${title ?? 'Movie'} Poster`}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </motion.div>

      {onClick && (
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
          Click poster to enlarge
        </p>
      )}

      {title && variant === 'results' && (
        <motion.p
          className="font-display text-lg mt-3"
          style={{ color: 'var(--color-text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {title}
        </motion.p>
      )}
    </motion.div>
  )
}

/** Loading skeleton for poster */
export function MoviePosterSkeleton({ maxWidth = 320 }: { maxWidth?: number }) {
  return (
    <div className="mx-auto mb-6 flex flex-col items-center">
      <div
        className="movie-poster-frame skeleton"
        style={{
          maxWidth,
          width: '100%',
          aspectRatio: '2/3',
        }}
      />
    </div>
  )
}
