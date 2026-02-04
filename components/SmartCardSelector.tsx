'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CardCarousel } from './CardCarousel'
import { CardBrowseModal } from './CardBrowseModal'
import { getFilteredContentRich } from '@/lib/content'
import { ContentItem } from '@/lib/content-types'

interface SmartCardSelectorProps {
  label: string
  icon: string
  type: 'characters' | 'settings' | 'circumstances'
  value: string
  onChange: (value: string) => void
  color: string
  isMature: boolean
  disableBrowse?: boolean
}

export function SmartCardSelector({
  label,
  icon,
  type,
  value,
  onChange,
  color,
  isMature,
  disableBrowse = false
}: SmartCardSelectorProps) {
  const [isBrowseOpen, setIsBrowseOpen] = useState(false)

  // Get rich content for browse modal
  const richContent = useMemo(() => {
    return getFilteredContentRich({ isMature })
  }, [isMature])

  // Get the appropriate content array based on type
  const contentItems = richContent[type]

  // Get string array for carousel (backwards compatible)
  const options = useMemo(() => {
    return contentItems.map(item => item.name)
  }, [contentItems])

  const handleBrowseSelect = (item: ContentItem) => {
    onChange(item.name)
  }

  return (
    <div className="relative">
      {/* Custom Header with Browse Button */}
      <div className="flex items-center justify-between mb-3">
        <label className="label flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </span>
        </label>

        <div className="flex items-center gap-2">
          {/* Browse Button */}
          {!disableBrowse && (
            <motion.button
              onClick={() => setIsBrowseOpen(true)}
              className="btn btn-ghost"
              style={{ padding: '8px 12px', fontSize: '14px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Browse all options"
            >
              <span>🔍</span>
              <span className="hidden sm:inline ml-1">Browse</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Carousel (without its own label) */}
      <CardCarouselNoLabel
        options={options}
        value={value}
        onChange={onChange}
        color={color}
      />

      {/* Browse Modal */}
      {!disableBrowse && (
        <CardBrowseModal
          isOpen={isBrowseOpen}
          onClose={() => setIsBrowseOpen(false)}
          type={type}
          options={contentItems}
          currentValue={value}
          onSelect={handleBrowseSelect}
          color={color}
        />
      )}
    </div>
  )
}

// Internal component: CardCarousel without its own label (since SmartCardSelector provides the header)
function CardCarouselNoLabel({
  options,
  value,
  onChange,
  color
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  color: string
}) {
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

  return (
    <div className="relative">
      {/* Shuffle Button */}
      <div className="flex justify-end mb-2">
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
          <motion.div
            className="card h-full flex items-center justify-center p-6"
            style={{
              borderLeft: hasSelection ? `4px solid ${color}` : '1px solid var(--color-border)',
              background: hasSelection ? 'var(--color-surface)' : 'var(--color-surface-alt)',
              transform: hasSelection ? 'translateY(-2px)' : 'none'
            }}
            animate={hasSelection ? {
              boxShadow: [
                `0 8px 16px rgba(0,0,0,0.1), 0 0 15px ${color}40`,
                `0 8px 16px rgba(0,0,0,0.1), 0 0 30px ${color}60`,
                `0 8px 16px rgba(0,0,0,0.1), 0 0 15px ${color}40`
              ]
            } : {
              boxShadow: 'none'
            }}
            transition={hasSelection ? {
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
