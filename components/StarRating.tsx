'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRate?: (rating: number) => void
  showValue?: boolean
  disabled?: boolean
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  showValue = false,
  disabled = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'text-sm gap-0.5',
    md: 'text-lg gap-1',
    lg: 'text-2xl gap-1.5'
  }

  const displayRating = hoverRating !== null ? hoverRating : rating

  const handleClick = (starIndex: number) => {
    if (interactive && !disabled && onRate) {
      onRate(starIndex + 1)
    }
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div
        className={`flex ${sizeClasses[size]} ${interactive && !disabled ? 'cursor-pointer' : ''}`}
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(displayRating)
          const partial = !filled && index < displayRating
          const partialWidth = partial ? (displayRating - index) * 100 : 0

          return (
            <motion.span
              key={index}
              className="relative"
              whileHover={interactive && !disabled ? { scale: 1.2 } : {}}
              whileTap={interactive && !disabled ? { scale: 0.9 } : {}}
              onClick={() => handleClick(index)}
              onMouseEnter={() => interactive && !disabled && setHoverRating(index + 1)}
            >
              {/* Background (empty) star */}
              <span style={{ color: 'var(--color-text-tertiary)' }}>★</span>

              {/* Filled star overlay */}
              <span
                className="absolute inset-0 overflow-hidden"
                style={{
                  color: 'var(--color-gold)',
                  width: filled ? '100%' : partial ? `${partialWidth}%` : '0%'
                }}
              >
                ★
              </span>
            </motion.span>
          )
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  )
}
