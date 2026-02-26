'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Script, TeleprompterSettings as TeleprompterSettingsType, SpectatorMessage } from '@/lib/types'
import { getCharactersInScene } from '@/lib/scriptUtils'
import { getMoodIndicator, getVisibleLines } from '@/lib/teleprompterUtils'
import dynamic from 'next/dynamic'
const TeleprompterSettingsPanel = dynamic(() => import('@/components/TeleprompterSettings').then(m => ({ default: m.TeleprompterSettings })), { ssr: false })
const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false })
import { SpectatorTicker } from '@/components/SpectatorChat'
import { MoviePosterFrame, MoviePosterSkeleton } from '@/components/MoviePosterFrame'
import { VARIANTS, MOTION } from '@/lib/animations'
import { tapHaptic } from '@/hooks/useHaptics'

export interface HostPerformingProps {
  script: Script
  currentLineIndex: number
  isPlaying: boolean
  roomCode: string
  networkLatency: number | null
  spectatorMessages: SpectatorMessage[]
  scriptImageUrl: string | null
  isGeneratingImage: boolean
  chaosCooldown: boolean
  chaosCooldownRemaining: number
  chaosShaking: boolean
  isSoloMode?: boolean
  teleprompterSettings: TeleprompterSettingsType
  teleprompterSettingsLoading: boolean
  onNextLine: () => void
  onPreviousLine: () => void
  onTogglePlayPause: () => void
  onTriggerChaos: () => void
  onSetTeleprompterPreset: (mode: 'focused' | 'balanced' | 'full') => void
  onSetTeleprompterCustom: (past: number | 'all', upcoming: number | 'all') => void
  onToggleTeleprompterAutoScroll: () => void
  onShowPosterLightbox: () => void
  onEndPerformance: () => void
}

export function HostPerforming({
  script, currentLineIndex, isPlaying, roomCode,
  networkLatency, spectatorMessages, scriptImageUrl, isGeneratingImage,
  chaosCooldown, chaosCooldownRemaining, chaosShaking, isSoloMode = false,
  teleprompterSettings, teleprompterSettingsLoading,
  onNextLine, onPreviousLine, onTogglePlayPause, onTriggerChaos,
  onSetTeleprompterPreset, onSetTeleprompterCustom, onToggleTeleprompterAutoScroll,
  onShowPosterLightbox, onEndPerformance,
}: HostPerformingProps) {
  const scriptContainerRef = useRef<HTMLDivElement | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNextLine()
      else if (e.key === 'ArrowLeft') onPreviousLine()
      else if (e.key === ' ') { e.preventDefault(); onTogglePlayPause() }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onNextLine, onPreviousLine, onTogglePlayPause])

  // Auto-scroll
  useEffect(() => {
    if (!teleprompterSettings.autoScroll || !scriptContainerRef.current) return
    const el = scriptContainerRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLineIndex, teleprompterSettings.autoScroll])

  return (
    <motion.div key="performing" variants={VARIANTS.curtainRise} initial="initial" animate="animate" exit="exit" className="container max-w-5xl">
      <SpectatorTicker messages={spectatorMessages} />
      {!isSoloMode && <AudienceReactionBar roomCode={roomCode} isPerforming={true} isHost={true} />}
      {!isSoloMode && <PlotTwistVoting roomCode={roomCode} isHost={true} />}

      {/* Poster */}
      <AnimatePresence mode="wait">
        {scriptImageUrl ? (
          <motion.div key="poster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MoviePosterFrame imageUrl={scriptImageUrl} title={script.title} onClick={onShowPosterLightbox} maxWidth={320} showNowShowing={true} variant="performance" />
          </motion.div>
        ) : isGeneratingImage ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MoviePosterSkeleton maxWidth={240} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Meta Info */}
      <motion.div className="mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-2xl sm:text-3xl font-display min-w-0 truncate" style={{ color: 'var(--color-text-primary)' }}>{script.title}</h2>
          {networkLatency !== null && (
            <motion.div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs shrink-0"
              style={{
                background: networkLatency < 100 ? 'var(--color-success)' : networkLatency < 300 ? 'var(--color-warning)' : 'var(--color-danger)',
                color: 'white', opacity: 0.8
              }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.8, scale: 1 }}
              title={`Network latency: ${networkLatency}ms`}
              aria-label={`Network latency: ${networkLatency}ms, ${networkLatency < 100 ? 'good' : networkLatency < 300 ? 'moderate' : 'poor'}`}
            >
              <span aria-hidden="true">{networkLatency < 100 ? '🟢' : networkLatency < 300 ? '🟡' : '🔴'}</span>
              <span>{networkLatency}ms</span>
            </motion.div>
          )}
        </div>
        <p className="text-lg italic mb-4" style={{ color: 'var(--color-text-secondary)' }}>{script.synopsis}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>Characters: {getCharactersInScene(script).join(', ')}</p>
        <div className="flex items-center gap-4">
          <span className="font-script font-bold" style={{ color: 'var(--color-accent)' }}>LINE {currentLineIndex + 1}/{script.lines.length}</span>
          <div className="progress flex-1">
            <motion.div className="progress-bar" initial={{ width: '0%' }} animate={{ width: `${((currentLineIndex + 1) / script.lines.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </motion.div>

      {/* Teleprompter Settings */}
      <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <TeleprompterSettingsPanel settings={teleprompterSettings} onPresetChange={onSetTeleprompterPreset} onCustomChange={onSetTeleprompterCustom} onAutoScrollToggle={onToggleTeleprompterAutoScroll} disabled={teleprompterSettingsLoading} />
      </motion.div>

      {/* Script */}
      <motion.div ref={scriptContainerRef} className="script-container mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="script-title">{script.title}</div>
        <AnimatePresence mode="sync">
          {getVisibleLines(script.lines, currentLineIndex, teleprompterSettings).map(({ line, originalIndex }) => {
            const moodIndicator = getMoodIndicator(line.mood)
            return (
              <motion.div
                key={originalIndex}
                className={`script-line ${originalIndex === currentLineIndex ? 'script-line-active' : originalIndex < currentLineIndex ? 'script-line-past' : 'script-line-upcoming'}`}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }} data-line-index={originalIndex}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="script-character">{line.speaker}</div>
                  {originalIndex === currentLineIndex && (
                    <motion.div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${moodIndicator.color}20`, border: `1px solid ${moodIndicator.color}60`, color: moodIndicator.color }}
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={MOTION.spring}
                    >
                      <span className="text-base" aria-hidden="true">{moodIndicator.emoji}</span>
                      <span>{moodIndicator.label}</span>
                    </motion.div>
                  )}
                </div>
                <div className="script-dialogue">{line.text}</div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 flex-wrap">
          <motion.button onClick={() => { tapHaptic(); onPreviousLine() }} disabled={currentLineIndex === 0} className="btn btn-ghost" style={{ opacity: currentLineIndex === 0 ? 0.5 : 1 }}
            whileHover={{ scale: currentLineIndex === 0 ? 1 : 1.05, x: currentLineIndex === 0 ? 0 : -2 }} whileTap={{ scale: currentLineIndex === 0 ? 1 : 0.95 }} aria-label="Previous line"><span className="hidden sm:inline">← </span>Prev</motion.button>
          <motion.button onClick={() => { tapHaptic(); onTogglePlayPause() }} className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={isPlaying ? 'Pause teleprompter' : 'Play teleprompter'}>{isPlaying ? '⏸ Pause' : '▶ Play'}</motion.button>
          <motion.button
            onClick={onTriggerChaos} disabled={chaosCooldown}
            className={`btn relative overflow-hidden ${chaosShaking ? 'animate-chaos-shake' : ''}`}
            style={{
              background: chaosCooldown ? 'linear-gradient(135deg, #6b21a8, #9d174d)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: 'white', opacity: chaosCooldown ? 0.7 : 1,
              boxShadow: chaosCooldown ? 'none' : '0 0 15px rgba(168, 85, 247, 0.4)',
            }}
            whileHover={!chaosCooldown ? { scale: 1.05 } : {}} whileTap={!chaosCooldown ? { scale: 0.95 } : {}}
            animate={!chaosCooldown ? { boxShadow: ['0 0 10px rgba(168, 85, 247, 0.3)', '0 0 25px rgba(168, 85, 247, 0.5)', '0 0 10px rgba(168, 85, 247, 0.3)'] } : {}}
            transition={!chaosCooldown ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            {chaosCooldown ? (
              <span className="flex items-center gap-2">🌀 {Math.ceil(chaosCooldownRemaining)}s</span>
            ) : (
              <span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>🌀</motion.span>{isSoloMode ? 'TWIST' : 'CHAOS'}</span>
            )}
            {chaosCooldown && (
              <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${(chaosCooldownRemaining / 30) * 100}%`, background: 'linear-gradient(90deg, #a855f7, #ec4899)', transition: 'width 0.1s linear' }} />
            )}
          </motion.button>
          <motion.button onClick={() => { tapHaptic(); onNextLine() }} disabled={currentLineIndex >= script.lines.length - 1} className="btn btn-ghost" style={{ opacity: currentLineIndex >= script.lines.length - 1 ? 0.5 : 1 }}
            whileHover={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 1.05, x: currentLineIndex >= script.lines.length - 1 ? 0 : 2 }}
            whileTap={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 0.95 }}>Next<span className="hidden sm:inline"> →</span></motion.button>
        </div>
        {currentLineIndex >= script.lines.length - 1 && (
          <motion.button
            onClick={() => { tapHaptic(); onEndPerformance() }}
            className="btn btn-primary w-full mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>🎭</span><span>Finish Scene → Vote</span>
          </motion.button>
        )}
        <motion.p className="hidden sm:flex text-center text-xs items-center justify-center gap-2" style={{ color: 'var(--color-text-tertiary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'var(--color-surface-alt)' }}>←</kbd><span>Previous</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'var(--color-surface-alt)' }}>Space</kbd><span>Play/Pause</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'var(--color-surface-alt)' }}>→</kbd><span>Next</span>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
