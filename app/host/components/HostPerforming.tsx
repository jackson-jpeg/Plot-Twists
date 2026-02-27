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
        background: '#1A1714',
        color: '#FDFCFA',
        minHeight: '100vh',
        margin: '0 auto',
        padding: '1.5rem',
        borderRadius: '0',
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
            style={{ color: '#9B9590', letterSpacing: '0.15em' }}
          >
            Line {currentLineIndex + 1} of {script.lines.length}
          </span>
          {networkLatency !== null && (
            <motion.div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0"
              style={{
                background: networkLatency < 100 ? 'rgba(76, 175, 80, 0.2)' : networkLatency < 300 ? 'rgba(245, 158, 66, 0.2)' : 'rgba(215, 122, 122, 0.2)',
                color: networkLatency < 100 ? '#82B682' : networkLatency < 300 ? '#F59E42' : '#D77A7A',
              }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              title={`Network latency: ${networkLatency}ms`}
              aria-label={`Network latency: ${networkLatency}ms, ${networkLatency < 100 ? 'good' : networkLatency < 300 ? 'moderate' : 'poor'}`}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                  background: networkLatency < 100 ? '#82B682' : networkLatency < 300 ? '#F59E42' : '#D77A7A',
                }}
              />
              <span>{networkLatency}ms</span>
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h2
          className="text-2xl sm:text-3xl font-display font-bold min-w-0 truncate mb-1"
          style={{ color: '#FDFCFA' }}
        >
          {script.title}
        </h2>
        <p className="text-sm italic mb-4" style={{ color: '#9B9590' }}>{script.synopsis}</p>
        <p className="text-xs mb-4" style={{ color: '#6B6560' }}>
          {getCharactersInScene(script).join(' / ')}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(155, 149, 144, 0.2)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#F59E42' }}
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
                  borderLeft: isCurrent ? '3px solid #F59E42' : '3px solid transparent',
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
                        style={{ color: '#F59E42', letterSpacing: '0.12em' }}
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
                      style={{ color: isCurrent ? '#FDFCFA' : '#C8C3BE' }}
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
        style={{ background: 'rgba(253, 252, 250, 0.05)', border: '1px solid rgba(155, 149, 144, 0.15)' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 flex-wrap">
          <motion.button
            onClick={() => { tapHaptic(); onPreviousLine() }}
            disabled={currentLineIndex === 0}
            className="flex items-center gap-1"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              opacity: currentLineIndex === 0 ? 0.3 : 0.8,
              color: '#FDFCFA',
              background: 'transparent',
              border: '1px solid rgba(155, 149, 144, 0.2)',
              cursor: currentLineIndex === 0 ? 'not-allowed' : 'pointer',
            }}
            whileHover={{ scale: currentLineIndex === 0 ? 1 : 1.05, x: currentLineIndex === 0 ? 0 : -2 }}
            whileTap={{ scale: currentLineIndex === 0 ? 1 : 0.95 }}
            aria-label="Previous line"
          >
            <span className="hidden sm:inline">&larr; </span>Prev
          </motion.button>

          {/* Play/Pause circle button */}
          <motion.button
            onClick={() => { tapHaptic(); onTogglePlayPause() }}
            className="flex items-center justify-center rounded-full"
            style={{
              width: '52px',
              height: '52px',
              background: '#F59E42',
              color: '#1A1714',
              border: 'none',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={isPlaying ? 'Pause teleprompter' : 'Play teleprompter'}
          >
            {isPlaying ? <PauseIcon size={22} color="#1A1714" /> : <PlayIcon size={22} color="#1A1714" />}
          </motion.button>

          <motion.button
            onClick={onTriggerChaos}
            disabled={chaosCooldown}
            className={`relative overflow-hidden flex items-center justify-center ${chaosShaking ? 'animate-chaos-shake' : ''}`}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              background: chaosCooldown ? 'rgba(155, 149, 144, 0.15)' : 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
              color: 'white',
              opacity: chaosCooldown ? 0.5 : 1,
              border: 'none',
              cursor: chaosCooldown ? 'not-allowed' : 'pointer',
            }}
            whileHover={!chaosCooldown ? { scale: 1.05 } : {}}
            whileTap={!chaosCooldown ? { scale: 0.95 } : {}}
            animate={!chaosCooldown ? { boxShadow: ['0 0 10px rgba(168, 85, 247, 0.2)', '0 0 25px rgba(168, 85, 247, 0.4)', '0 0 10px rgba(168, 85, 247, 0.2)'] } : {}}
            transition={!chaosCooldown ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            {chaosCooldown ? (
              <span className="flex items-center gap-2">
                <ChaosIcon size={16} color="white" /> {Math.ceil(chaosCooldownRemaining)}s
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ChaosIcon size={16} color="white" />{isSoloMode ? 'TWIST' : 'CHAOS'}
              </span>
            )}
            {chaosCooldown && (
              <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${(chaosCooldownRemaining / 30) * 100}%`, background: 'linear-gradient(90deg, var(--color-purple), var(--color-pink))', transition: 'width 0.1s linear' }} />
            )}
          </motion.button>

          <motion.button
            onClick={() => { tapHaptic(); onNextLine() }}
            disabled={currentLineIndex >= script.lines.length - 1}
            className="flex items-center gap-1"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              opacity: currentLineIndex >= script.lines.length - 1 ? 0.3 : 0.8,
              color: '#FDFCFA',
              background: 'transparent',
              border: '1px solid rgba(155, 149, 144, 0.2)',
              cursor: currentLineIndex >= script.lines.length - 1 ? 'not-allowed' : 'pointer',
            }}
            whileHover={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 1.05, x: currentLineIndex >= script.lines.length - 1 ? 0 : 2 }}
            whileTap={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 0.95 }}
            aria-label="Next line"
          >
            Next<span className="hidden sm:inline"> &rarr;</span>
          </motion.button>
        </div>

        {currentLineIndex >= script.lines.length - 1 && (
          <motion.button
            onClick={() => { tapHaptic(); onEndPerformance() }}
            className="w-full mt-3"
            style={{ padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, background: '#F59E42', color: '#1A1714', border: 'none', cursor: 'pointer' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finish Scene -- Vote
          </motion.button>
        )}

        <motion.p
          className="hidden sm:flex text-center text-xs items-center justify-center gap-2 mt-3"
          style={{ color: '#6B6560' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(155, 149, 144, 0.15)', color: '#9B9590' }}>&larr;</kbd>
          <span>Previous</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(155, 149, 144, 0.15)', color: '#9B9590' }}>Space</kbd>
          <span>Play/Pause</span>
          <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(155, 149, 144, 0.15)', color: '#9B9590' }}>&rarr;</kbd>
          <span>Next</span>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
