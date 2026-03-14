'use client'

import React, { useState, useCallback, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_BOUNCY } from '@/lib/motion'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const shouldReduceMotion = useReducedMotion()

  const currentIndex = options.findIndex(opt => opt === value)
  const hasSelection = value !== ''

  const handlePrevious = useCallback(() => {
    if (options.length === 0) return
    setDirection(-1)
    const newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
    onChange(options[newIndex])
  }, [options, currentIndex, onChange])

  const handleNext = useCallback(() => {
    if (options.length === 0) return
    setDirection(1)
    const newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1
    onChange(options[newIndex])
  }, [options, currentIndex, onChange])

  const handleShuffle = useCallback(() => {
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
  }, [options, currentIndex, onChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if this carousel has focus
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevious, handleNext])

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
    <div
      ref={containerRef}
      className="relative"
      role="group"
      aria-labelledby={labelId}
      aria-label={`${label} carousel. Use left and right arrow keys to navigate.`}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <label id={labelId} className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        </label>
        <motion.button
          onClick={handleShuffle}
          style={{ padding: '12px 16px', fontSize: '20px', minWidth: '44px', minHeight: '44px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 180 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
          aria-label={`Shuffle ${label}`}
        >
          🎲
        </motion.button>
      </div>

      {/* Card Display */}
      <div className="relative" style={{ height: '180px', perspective: '1000px' }} tabIndex={0}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={value || 'empty'}
            custom={direction}
            variants={shouldReduceMotion ? undefined : slideVariants}
            initial={shouldReduceMotion ? false : "enter"}
            animate={isShaking ? "shake" : "center"}
            exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
            transition={shouldReduceMotion ? { duration: 0 } : {
              x: SPRING,
              opacity: { duration: 0.2 },
              rotateY: SPRING_BOUNCY
            }}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
            aria-current={hasSelection ? "true" : undefined}
            aria-label={hasSelection ? `Selected: ${value}` : 'No selection'}
          >
            <motion.div
              className="h-full flex items-center justify-center p-6 rounded-xl"
              style={{
                borderLeft: hasSelection ? `4px solid ${color}` : '1px solid var(--color-border)',
                background: hasSelection ? 'var(--color-surface)' : 'var(--color-surface-alt)',
                transform: hasSelection ? 'translateY(-2px)' : 'none'
              }}
              animate={hasSelection && !shouldReduceMotion ? {
                boxShadow: [
                  `0 8px 16px rgba(0,0,0,0.1), 0 0 15px ${color}40`,
                  `0 8px 16px rgba(0,0,0,0.1), 0 0 30px ${color}60`,
                  `0 8px 16px rgba(0,0,0,0.1), 0 0 15px ${color}40`
                ]
              } : {
                boxShadow: 'none'
              }}
              transition={hasSelection && !shouldReduceMotion ? {
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              } : {}}
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
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
          <motion.button
            onClick={handlePrevious}
            className="pointer-events-auto"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '24px',
              marginLeft: '-60px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1, x: 4 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
            disabled={options.length === 0}
            aria-label={`Previous ${label}`}
          >
            ‹
          </motion.button>

          <motion.button
            onClick={handleNext}
            className="pointer-events-auto"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '24px',
              marginRight: '-60px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.1, x: -4 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
            disabled={options.length === 0}
            aria-label={`Next ${label}`}
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
