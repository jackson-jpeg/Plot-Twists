'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

function PosterFallback({ title, maxWidth }: { title?: string; maxWidth?: number }) {
  return (
    <div
      style={{
        maxWidth: maxWidth ?? 320,
        width: '100%',
        aspectRatio: '2/3',
        background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
        borderRadius: 'var(--radius-lg, 12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        gap: '0.75rem',
      }}
    >
      <span style={{ fontSize: '3rem' }}>🎬</span>
      {title && (
        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', lineHeight: 1.3 }}>
          {title}
        </span>
      )}
    </div>
  )
}

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
  const [imgError, setImgError] = useState(false)

  if (variant === 'lightbox') {
    if (imgError) return <PosterFallback title={title} maxWidth={500} />
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img
          src={imageUrl}
          alt={`${title ?? 'Movie'} Poster`}
          className="movie-poster-frame"
          loading="lazy"
          style={{ maxHeight: '75dvh', maxWidth: '100%', objectFit: 'contain', aspectRatio: '2/3' }}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  if (imgError) {
    return (
      <div className="mx-auto mb-6 flex flex-col items-center">
        <PosterFallback title={title} maxWidth={maxWidth} />
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
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `View ${title ?? 'movie'} poster` : undefined}
        className="movie-poster-frame"
        style={{ maxWidth, position: 'relative', cursor: onClick ? 'pointer' : undefined }}
        whileHover={onClick ? { scale: 1.03 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {showNowShowing && (
          <div className="movie-poster-ribbon">NOW SHOWING</div>
        )}
        <img
          src={imageUrl}
          alt={`${title ?? 'Movie'} Poster`}
          loading="lazy"
          style={{ width: '100%', objectFit: 'contain', display: 'block', aspectRatio: '2/3' }}
          onError={() => setImgError(true)}
        />
      </motion.div>

      {onClick && (
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
          Tap poster to enlarge
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
