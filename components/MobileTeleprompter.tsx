'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { getMoodIndicator } from '@/lib/teleprompterUtils'
import { MOTION } from '@/lib/animations'
import { getCharactersInScene } from '@/lib/scriptUtils'
import type { Script } from '@/lib/types'

interface MobileTeleprompterProps {
  script: Script
  currentLineIndex: number
  myCharacter: string
  onNextLine: () => void
  onPreviousLine: () => void
}

const FONT_SIZE_KEY = 'pt-teleprompter-font-size'
const DEFAULT_FONT_SIZE = 24
const MIN_FONT_SIZE = 18
const MAX_FONT_SIZE = 40

export function MobileTeleprompter({
  script,
  currentLineIndex,
  myCharacter,
  onNextLine,
  onPreviousLine,
}: MobileTeleprompterProps) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showYourTurn, setShowYourTurn] = useState(false)
  const lineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousSpeakerRef = useRef<string>('')
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5])

  // Load font size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY)
    if (saved) {
      const size = parseInt(saved, 10)
      if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) setFontSize(size)
    }
  }, [])

  const updateFontSize = (delta: number) => {
    setFontSize(prev => {
      const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prev + delta))
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }

  // Auto-scroll to current line
  useEffect(() => {
    lineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLineIndex])

  // "YOUR TURN" flash when it becomes the player's turn
  const currentLine = script.lines[currentLineIndex]
  useEffect(() => {
    if (!currentLine) return
    if (currentLine.speaker === myCharacter && previousSpeakerRef.current !== myCharacter) {
      setShowYourTurn(true)
      const timer = setTimeout(() => setShowYourTurn(false), 1500)
      return () => clearTimeout(timer)
    }
    previousSpeakerRef.current = currentLine.speaker
  }, [currentLineIndex, currentLine, myCharacter])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Swipe gestures
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80 && info.velocity.x < -200) {
      onNextLine()
    } else if (info.offset.x > 80 && info.velocity.x > 200) {
      onPreviousLine()
    }
  }

  if (!currentLine) return null
  const isMyTurn = currentLine.speaker === myCharacter
  const moodIndicator = getMoodIndicator(currentLine.mood)

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* YOUR TURN full-screen flash */}
      <AnimatePresence>
        {showYourTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(245, 158, 66, 0.15)',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={MOTION.bouncy}
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: 'var(--color-accent)',
                textShadow: '0 2px 20px rgba(245,158,66,0.5)',
              }}
            >
              YOUR TURN
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="p-4" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-script">{script.title}</span>
          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <button
              onClick={() => updateFontSize(-2)}
              className="w-7 h-7 rounded flex items-center justify-center text-xs"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
              aria-label="Decrease font size"
            >
              A-
            </button>
            <button
              onClick={() => updateFontSize(2)}
              className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
              aria-label="Increase font size"
            >
              A+
            </button>
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '⊟' : '⊞'}
            </button>
            <span className="font-script">{currentLineIndex + 1}/{script.lines.length}</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentLineIndex + 1) / script.lines.length) * 100}%`,
              background: 'var(--color-accent)'
            }}
          />
        </div>
        <p className="px-4 pt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Characters: {getCharactersInScene(script).join(', ')}
        </p>
      </div>

      {/* Script Display — swipeable */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-4"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, touchAction: 'pan-y' }}
      >
        <div ref={lineRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center w-full max-w-2xl"
            >
              {isMyTurn && (
                <div className="script-your-turn mb-6">
                  ★ YOUR TURN
                </div>
              )}

              <div
                className="inline-block px-6 py-2 rounded-lg mb-3"
                style={{
                  background: isMyTurn ? 'var(--color-highlight-pink)' : 'var(--color-surface-alt)',
                  border: `2px solid ${isMyTurn ? 'var(--color-accent)' : 'var(--color-border)'}`
                }}
              >
                <p className="font-script font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                  {currentLine.speaker}
                </p>
              </div>

              {/* Mood indicator — larger during performance */}
              <motion.div
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold mb-6 inline-flex"
                style={{
                  fontSize: '1.125rem',
                  background: `${moodIndicator.color}20`,
                  border: `1px solid ${moodIndicator.color}60`,
                  color: moodIndicator.color
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...MOTION.spring, delay: 0.1 }}
              >
                <span style={{ fontSize: '1.25rem' }}>{moodIndicator.emoji}</span>
                <span>{moodIndicator.label}</span>
              </motion.div>

              <div
                className={`card p-8 ${isMyTurn ? 'your-turn-enhanced' : ''}`}
                style={{
                  borderLeft: isMyTurn ? '3px solid var(--color-accent)' : '1px solid var(--color-border)'
                }}
              >
                <p className="font-script leading-relaxed" style={{
                  color: 'var(--color-text-primary)',
                  fontSize: isMyTurn ? `${fontSize + 4}px` : `${fontSize}px`,
                }}>
                  {currentLine.text}
                </p>
              </div>

              {currentLineIndex < script.lines.length - 1 && (
                <div className="mt-6 p-4 rounded-lg text-left" style={{ background: 'var(--color-surface-alt)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>COMING UP:</p>
                  <p className="font-script font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {script.lines[currentLineIndex + 1].speaker}
                  </p>
                  <p className="font-script text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {script.lines[currentLineIndex + 1].text}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Player Navigation Controls */}
      <div className="p-4 pb-safe" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <motion.button
            onClick={onPreviousLine}
            disabled={currentLineIndex === 0}
            className="btn btn-ghost"
            style={{
              opacity: currentLineIndex === 0 ? 0.5 : 1,
              padding: '12px 20px'
            }}
            whileHover={currentLineIndex > 0 ? { scale: 1.05, x: -2 } : {}}
            whileTap={currentLineIndex > 0 ? { scale: 0.95 } : {}}
          >
            ← Previous
          </motion.button>

          <span className="font-script text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {currentLineIndex + 1} / {script.lines.length}
          </span>

          <motion.button
            onClick={onNextLine}
            disabled={currentLineIndex >= script.lines.length - 1}
            className="btn btn-ghost"
            style={{
              opacity: currentLineIndex >= script.lines.length - 1 ? 0.5 : 1,
              padding: '12px 20px'
            }}
            whileHover={currentLineIndex < script.lines.length - 1 ? { scale: 1.05, x: 2 } : {}}
            whileTap={currentLineIndex < script.lines.length - 1 ? { scale: 0.95 } : {}}
          >
            Next →
          </motion.button>
        </div>
        <motion.p
          className="text-center text-xs mt-2"
          style={{ color: 'var(--color-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Swipe or tap to navigate
        </motion.p>
      </div>
    </div>
  )
}
