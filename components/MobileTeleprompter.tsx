'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { getMoodIndicator } from '@/lib/teleprompterUtils'
import { SPRING_BOUNCY, SPRING } from '@/lib/motion'
import type { Script } from '@/lib/types'
import { isCapacitorNative } from '@/lib/platform'
import { tapHaptic } from '@/hooks/useHaptics'

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
    <div ref={containerRef} className="flex flex-col flex-1" style={{ background: '#faf7f0' }}>
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
              background: 'rgba(194, 59, 34, 0.12)',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={SPRING_BOUNCY}
              style={{
                fontSize: '48px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-stage-red, #c23b22)',
                textShadow: '0 2px 20px rgba(194,59,34,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              YOUR TURN
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red "YOUR LINE" tab at top when it's your turn */}
      {isMyTurn && (
        <div style={{
          background: 'var(--color-stage-red, #c23b22)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
        }}>
          YOUR LINE
        </div>
      )}

      {/* Font controls + progress bar */}
      <div className="px-4 py-3" style={{ background: '#f4f0e8', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <button
              onClick={() => updateFontSize(-2)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.05)', color: '#5a5548' }}
              aria-label="Decrease font size"
            >
              A-
            </button>
            <button
              onClick={() => updateFontSize(2)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.05)', color: '#5a5548' }}
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
          {/* Fullscreen button — hidden in Capacitor where API is unsupported */}
          {!isCapacitorNative() && (
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.05)', color: '#5a5548' }}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '\u229F' : '\u229E'}
            </button>
          )}
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentLineIndex + 1) / script.lines.length) * 100}%`,
              background: 'var(--color-stage-red, #c23b22)',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>

      {/* Script Display — swipeable cue card */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, touchAction: 'pan-y', background: '#faf7f0' }}
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
              {/* Character name */}
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: isMyTurn ? 'var(--color-stage-red, #c23b22)' : '#8a8478',
                marginBottom: '8px',
              }}>
                {currentLine.speaker}
              </p>

              {/* Mood indicator */}
              {moodIndicator.label !== 'Neutral' && (
                <motion.div
                  className="flex items-center justify-center gap-2 mb-4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.1 }}
                >
                  <span style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: '#8a8478',
                  }}>
                    ({moodIndicator.label})
                  </span>
                </motion.div>
              )}

              {/* The line — large, mono, dark on cream */}
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isMyTurn ? `${fontSize + 4}px` : `${fontSize}px`,
                lineHeight: 1.5,
                color: '#1a1812',
                textAlign: 'center',
                maxWidth: '480px',
                margin: '0 auto',
              }}>
                {currentLine.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* "Up Next" footer */}
      {currentLineIndex < script.lines.length - 1 && (
        <div style={{
          background: '#e8e2d4',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '12px 20px',
        }}>
          <p style={{
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#a09a8e',
            marginBottom: '4px',
          }}>
            UP NEXT
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#5a5548',
            lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {script.lines[currentLineIndex + 1].speaker}
            </span>
            {' \u2014 '}
            {script.lines[currentLineIndex + 1].text.length > 80
              ? script.lines[currentLineIndex + 1].text.slice(0, 80) + '\u2026'
              : script.lines[currentLineIndex + 1].text
            }
          </p>
        </div>
      )}

      {/* Player Navigation Controls */}
      <div className="p-4 pb-safe" style={{ background: '#f4f0e8', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <motion.button
            onClick={() => { tapHaptic(); onPreviousLine() }}
            disabled={currentLineIndex === 0}
            style={{
              opacity: currentLineIndex === 0 ? 0.4 : 1,
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: '#5a5548',
              fontSize: '14px',
              fontWeight: 600,
              cursor: currentLineIndex === 0 ? 'not-allowed' : 'pointer',
            }}
            whileTap={currentLineIndex > 0 ? { scale: 0.95 } : {}}
          >
            Prev
          </motion.button>

          <motion.button
            onClick={() => { tapHaptic(); onNextLine() }}
            disabled={currentLineIndex >= script.lines.length - 1}
            style={{
              opacity: currentLineIndex >= script.lines.length - 1 ? 0.5 : 1,
              padding: '12px 28px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--color-stage-red, #c23b22)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: currentLineIndex >= script.lines.length - 1 ? 'not-allowed' : 'pointer',
            }}
            whileHover={currentLineIndex < script.lines.length - 1 ? { scale: 1.03 } : {}}
            whileTap={currentLineIndex < script.lines.length - 1 ? { scale: 0.97 } : {}}
          >
            Next Line
          </motion.button>
        </div>
        <motion.p
          className="text-center text-xs mt-2"
          style={{ color: '#a09a8e' }}
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
