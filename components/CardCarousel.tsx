'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CardCarouselProps {
  label: string
  icon: string
  options: string[]
  value: string
  onChange: (value: string) => void
  color: string
}

export function CardCarousel({ label, icon, options, value, onChange, color }: CardCarouselProps) {
  const [direction, setDirection] = useState(0)
  const [isShaking, setIsShaking] = useState(false)

  const currentIndex = options.findIndex(opt => opt === value)
  const hasSelection = value !== ''

  const handlePrevious = () => {
    if (options.length === 0) return
    setDirection(-1)
    const newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
    onChange(options[newIndex])
  }

  const handleNext = () => {
    if (options.length === 0) return
    setDirection(1)
    const newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1
    onChange(options[newIndex])
  }

  const handleShuffle = () => {
    if (options.length === 0) return
    setIsShaking(true)

    // Pick random option different from current if possible
    let randomIndex = Math.floor(Math.random() * options.length)
    if (options.length > 1 && currentIndex >= 0) {
      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * options.length)
      }
    }

    setDirection(randomIndex > currentIndex ? 1 : -1)
    onChange(options[randomIndex])

    setTimeout(() => setIsShaking(false), 500)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      rotateY: direction > 0 ? -45 : 45
    })
  }

  const shakeVariants = {
    shake: {
      rotate: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="relative">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <label className="label flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        </label>
        <motion.button
          onClick={handleShuffle}
          className="btn btn-ghost"
          style={{ padding: '8px 12px', fontSize: '20px' }}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          title="Shuffle"
        >
          🎲
        </motion.button>
      </div>

      {/* Card Display */}
      <div className="relative" style={{ height: '180px', perspective: '1000px' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={value || 'empty'}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate={isShaking ? "shake" : "center"}
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { type: "spring", stiffness: 200, damping: 20 }
            }}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="card h-full flex items-center justify-center p-6"
              style={{
                borderLeft: hasSelection ? `4px solid ${color}` : '1px solid var(--color-border)',
                background: hasSelection ? 'var(--color-surface)' : 'var(--color-surface-alt)',
                boxShadow: hasSelection ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
                transform: hasSelection ? 'translateY(-2px)' : 'none'
              }}
            >
              {hasSelection ? (
                <p
                  className="font-script text-center text-xl leading-relaxed"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {value}
                </p>
              ) : (
                <p
                  className="font-display text-center"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Click Next or Shuffle to select
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
          <motion.button
            onClick={handlePrevious}
            className="btn btn-secondary pointer-events-auto"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '24px',
              marginLeft: '-60px'
            }}
            whileHover={{ scale: 1.1, x: 4 }}
            whileTap={{ scale: 0.9 }}
            disabled={options.length === 0}
          >
            ‹
          </motion.button>

          <motion.button
            onClick={handleNext}
            className="btn btn-secondary pointer-events-auto"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '24px',
              marginRight: '-60px'
            }}
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.9 }}
            disabled={options.length === 0}
          >
            ›
          </motion.button>
        </div>
      </div>

      {/* Progress Indicator */}
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-3 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {currentIndex + 1} / {options.length}
        </motion.div>
      )}
    </div>
  )
}
