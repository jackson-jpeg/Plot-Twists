'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Script, TeleprompterSettings as TeleprompterSettingsType, SpectatorMessage } from '@/lib/types'
import { getCharactersInScene } from '@/lib/scriptUtils'
import { getMoodIndicator, getVisibleLines } from '@/lib/teleprompterUtils'
import dynamic from 'next/dynamic'
const TeleprompterSettingsPanel = dynamic(() => import('@/components/TeleprompterSettings').then(m => ({ default: m.TeleprompterSettings })), { ssr: false, loading: () => <div style={{ height: 40 }} /> })
const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
import { SpectatorTicker } from '@/components/SpectatorChat'
import { MoviePosterFrame, MoviePosterSkeleton } from '@/components/MoviePosterFrame'
import { VARIANTS, MOTION } from '@/lib/animations'
import { tapHaptic } from '@/hooks/useHaptics'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PauseIcon, PlayIcon, ChaosIcon } from '@/components/GameIcons'

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
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

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
    <motion.div
      key="performing"
      variants={VARIANTS.curtainRise}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-5xl mx-auto px-5"
      style={{
        background: 'var(--color-theater-bg)',
        color: 'var(--color-theater-text)',
        minHeight: '100vh',
        margin: '0 auto',
        padding: isDesktop ? '2rem 3rem' : '1.5rem',
        paddingTop: isDesktop ? '2rem' : 'max(1.5rem, env(safe-area-inset-top, 0px))',
        maxWidth: isDesktop ? '1000px' : undefined,
      }}
    >
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

      {/* Scene indicator + timer */}
      <motion.div className="mb-4" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-theater-muted)', letterSpacing: '0.15em' }}
          >
            Line {currentLineIndex + 1} of {script.lines.length}
          </span>
          <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0"
            style={{ background: 'var(--color-success-bg, rgba(76, 175, 80, 0.2))', color: 'var(--color-success)' }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: 'var(--color-success)' }} />
            <span>LIVE</span>
          </motion.div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl sm:text-3xl font-display font-bold min-w-0 truncate mb-1"
          style={{ color: 'var(--color-theater-text)' }}
        >
          {script.title}
        </h2>
        <p className="text-sm italic mb-4" style={{ color: 'var(--color-theater-muted)' }}>{script.synopsis}</p>
        <p className="text-xs mb-4" style={{ color: 'var(--color-theater-muted)' }}>
          {getCharactersInScene(script).join(' / ')}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--color-accent)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${((currentLineIndex + 1) / script.lines.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Teleprompter Settings */}
      <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <TeleprompterSettingsPanel settings={teleprompterSettings} onPresetChange={onSetTeleprompterPreset} onCustomChange={onSetTeleprompterCustom} onAutoScrollToggle={onToggleTeleprompterAutoScroll} disabled={teleprompterSettingsLoading} />
      </motion.div>

      {/* Script */}
      <motion.div
        ref={scriptContainerRef}
        className="mb-6 rounded-xl p-4 sm:p-6"
        style={{ background: 'rgba(253, 252, 250, 0.03)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="sync">
          {getVisibleLines(script.lines, currentLineIndex, teleprompterSettings).map(({ line, originalIndex }) => {
            const isCurrent = originalIndex === currentLineIndex
            const isPast = originalIndex < currentLineIndex
            const moodIndicator = getMoodIndicator(line.mood)
            const isStageDirection = line.speaker?.toLowerCase() === 'stage direction' || line.speaker?.toLowerCase() === 'narrator'

            return (
              <motion.div
                key={originalIndex}
                className="py-3 px-4 rounded-lg mb-2"
                style={{
                  background: isCurrent ? 'rgba(245, 158, 66, 0.08)' : 'transparent',
                  borderLeft: isCurrent ? '3px solid var(--color-accent)' : '3px solid transparent',
                  opacity: isPast ? 0.4 : 1,
                  transition: 'background 0.2s, opacity 0.2s',
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: isPast ? 0.4 : 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                data-line-index={originalIndex}
              >
                {isStageDirection ? (
                  <p className="text-sm italic" style={{ color: 'rgba(245, 158, 66, 0.6)' }}>
                    ({line.text})
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'var(--color-accent)', letterSpacing: '0.12em' }}
                      >
                        {line.speaker}
                      </span>
                      {isCurrent && moodIndicator.label !== 'Neutral' && (
                        <motion.span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: `${moodIndicator.color}15`,
                            color: moodIndicator.color,
                            border: `1px solid ${moodIndicator.color}30`,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={MOTION.spring}
                        >
                          {moodIndicator.label}
                        </motion.span>
                      )}
                    </div>
                    <p
                      className="text-base sm:text-lg leading-relaxed"
                      style={{ color: isCurrent ? 'var(--color-theater-text)' : 'var(--color-theater-muted)' }}
                    >
                      {line.text}
                    </p>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="rounded-xl p-4"
        style={{ background: 'rgba(253, 252, 250, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Two equal dark buttons: Pause + Skip */}
        <div className="flex gap-3 mb-3">
          <motion.button
            onClick={() => { tapHaptic(); onTogglePlayPause() }}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-theater-text)',
              background: 'rgba(253, 252, 250, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            aria-label={isPlaying ? 'Pause teleprompter' : 'Play teleprompter'}
          >
            {isPlaying ? <PauseIcon size={18} color="currentColor" /> : <PlayIcon size={18} color="currentColor" />}
            {isPlaying ? 'Pause' : 'Play'}
          </motion.button>

          <motion.button
            onClick={() => { tapHaptic(); onNextLine() }}
            disabled={currentLineIndex >= script.lines.length - 1}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              opacity: currentLineIndex >= script.lines.length - 1 ? 0.4 : 1,
              color: 'var(--color-theater-text)',
              background: 'rgba(253, 252, 250, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: currentLineIndex >= script.lines.length - 1 ? 'not-allowed' : 'pointer',
            }}
            whileHover={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 1.02 }}
            whileTap={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 0.97 }}
            aria-label="Skip to next line"
          >
            <PlayIcon size={18} color="currentColor" />
            Skip &rarr;
          </motion.button>
        </div>

        {/* Full-width PLOT TWIST button — hidden in solo or on cooldown */}
        {!isSoloMode && (
          <motion.button
            onClick={() => { tapHaptic(); onTriggerChaos() }}
            disabled={chaosCooldown}
            className={`w-full relative overflow-hidden flex items-center justify-center gap-2 mb-3 ${chaosShaking ? 'animate-chaos-shake' : ''}`}
            style={{
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              background: chaosCooldown ? 'rgba(155, 149, 144, 0.15)' : 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
              color: 'white',
              opacity: chaosCooldown ? 0.5 : 1,
              border: 'none',
              cursor: chaosCooldown ? 'not-allowed' : 'pointer',
            }}
            whileHover={!chaosCooldown ? { scale: 1.02 } : {}}
            whileTap={!chaosCooldown ? { scale: 0.97 } : {}}
          >
            {chaosCooldown ? (
              <>
                <ChaosIcon size={18} color="white" />
                Plot Twist ({Math.ceil(chaosCooldownRemaining)}s)
              </>
            ) : (
              <>
                <ChaosIcon size={18} color="white" />
                ★ PLOT TWIST!
              </>
            )}
            {chaosCooldown && (
              <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${(chaosCooldownRemaining / 30) * 100}%`, background: 'linear-gradient(90deg, var(--color-purple), var(--color-pink))', transition: 'width 0.1s linear' }} />
            )}
          </motion.button>
        )}

        {currentLineIndex >= script.lines.length - 1 && (
          <motion.button
            onClick={() => { tapHaptic(); onEndPerformance() }}
            className="w-full"
            style={{ padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, background: 'var(--color-accent)', color: 'var(--color-theater-bg)', border: 'none', cursor: 'pointer' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finish Scene — Vote
          </motion.button>
        )}

        <motion.p
          className="hidden sm:flex text-center text-xs items-center justify-center gap-2 mt-3"
          style={{ color: 'var(--color-theater-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--color-theater-muted)' }}>&larr;</kbd>
          <span>Previous</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--color-theater-muted)' }}>Space</kbd>
          <span>Play/Pause</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--color-theater-muted)' }}>&rarr;</kbd>
          <span>Next</span>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
