'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { getCharactersInScene } from '@/lib/scriptUtils'
import { getMoodIndicator, getVisibleLines } from '@/lib/teleprompterUtils'
import dynamic from 'next/dynamic'
const TeleprompterSettingsPanel = dynamic(() => import('@/components/TeleprompterSettings').then(m => ({ default: m.TeleprompterSettings })), { ssr: false, loading: () => <div style={{ height: 40 }} /> })
const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
import { SpectatorTicker } from '@/components/SpectatorChat'
import { MoviePosterFrame, MoviePosterSkeleton } from '@/components/MoviePosterFrame'
import { SPRING, SPRING_GENTLE, ENTER_Y, PRESS } from '@/lib/motion'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PauseIcon, PlayIcon, ChaosIcon } from '@/components/GameIcons'
import { Button } from '@/components/ui'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import { useScriptStore } from '@/stores/scriptStore'
import { useAudienceStore } from '@/stores/audienceStore'
import { useGameStore } from '@/stores/gameStore'
import { socketManager } from '@/lib/socketManager'

export interface HostPerformingProps {
  onShowPosterLightbox: () => void
}

export function HostPerforming({ onShowPosterLightbox }: HostPerformingProps) {
  const prefersReducedMotion = useReducedMotion()
  const scriptContainerRef = useRef<HTMLDivElement | null>(null)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const script = useScriptStore((s) => s.script)
  const currentLineIndex = useScriptStore((s) => s.currentLineIndex)
  const setCurrentLineIndex = useScriptStore((s) => s.setCurrentLineIndex)
  const isPlaying = useScriptStore((s) => s.isPlaying)
  const setIsPlaying = useScriptStore((s) => s.setIsPlaying)
  const scriptImageUrl = useScriptStore((s) => s.imageUrl)
  const isGeneratingImage = useScriptStore((s) => s.isGeneratingImage)

  const spectatorMessages = useAudienceStore((s) => s.spectatorMessages)
  const chaosCooldown = useAudienceStore((s) => s.chaosCooldown)
  const setChaosCooldown = useAudienceStore((s) => s.setChaosCooldown)

  const roomCode = useGameStore((s) => s.roomCode)
  const settings = useGameStore((s) => s.settings)
  const isSoloMode = settings?.gameMode === 'SOLO'

  // Teleprompter settings from hook
  const {
    settings: teleprompterSettings,
    setPreset: onSetTeleprompterPreset,
    setCustom: onSetTeleprompterCustom,
    toggleAutoScroll: onToggleTeleprompterAutoScroll,
    isLoading: teleprompterSettingsLoading,
  } = useTeleprompterSettings()

  // Local chaos UI state
  const [chaosCooldownRemaining, setChaosCooldownRemaining] = useState(0)
  const [chaosShaking, setChaosShaking] = useState(false)

  // Chaos cooldown timer
  useEffect(() => {
    if (!chaosCooldown) return
    setChaosCooldownRemaining(30)
    const interval = setInterval(() => {
      setChaosCooldownRemaining(prev => {
        if (prev <= 0.1) { setChaosCooldown(false); clearInterval(interval); return 0 }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [chaosCooldown, setChaosCooldown])

  // Actions
  const nextLine = useCallback(() => {
    if (script && currentLineIndex < script.lines.length - 1) {
      const newIndex = currentLineIndex + 1
      setCurrentLineIndex(newIndex)
      socketManager.emit('jump_to_line', roomCode, newIndex)
    }
  }, [script, currentLineIndex, roomCode, setCurrentLineIndex])

  const previousLine = useCallback(() => {
    if (currentLineIndex > 0) {
      const newIndex = currentLineIndex - 1
      setCurrentLineIndex(newIndex)
      socketManager.emit('jump_to_line', roomCode, newIndex)
    }
  }, [currentLineIndex, roomCode, setCurrentLineIndex])

  const togglePlayPause = useCallback(() => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    if (newPlayingState) socketManager.emit('resume_script', roomCode)
    else socketManager.emit('pause_script', roomCode)
  }, [isPlaying, roomCode, setIsPlaying])

  const triggerChaos = useCallback(() => {
    if (chaosCooldown) return
    socketManager.emit('start_plot_twist', roomCode)
    setChaosCooldown(true)
    setChaosShaking(true)
    setTimeout(() => setChaosShaking(false), 500)
    successHaptic()
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
  }, [roomCode, chaosCooldown, setChaosCooldown])

  const endPerformance = useCallback(() => {
    socketManager.emit('end_performance', roomCode)
  }, [roomCode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea, [role="slider"]')) return
      if (e.key === 'ArrowRight') nextLine()
      else if (e.key === 'ArrowLeft') previousLine()
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause() }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [nextLine, previousLine, togglePlayPause])

  // Auto-scroll
  useEffect(() => {
    if (!teleprompterSettings.autoScroll || !scriptContainerRef.current) return
    const el = scriptContainerRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLineIndex, teleprompterSettings.autoScroll])

  // Guard: script must exist (parent checks this too)
  if (!script) return null

  return (
    <motion.div
      key="performing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="w-full max-w-5xl mx-auto px-5"
      style={{
        background: 'var(--color-theater-bg)',
        color: 'var(--color-theater-text)',
        minHeight: '100dvh',
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

      {/* Teleprompter Settings */}
      <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <TeleprompterSettingsPanel settings={teleprompterSettings} onPresetChange={onSetTeleprompterPreset} onCustomChange={onSetTeleprompterCustom} onAutoScrollToggle={onToggleTeleprompterAutoScroll} disabled={teleprompterSettingsLoading} />
      </motion.div>

      {/* Script — Paper on a desk */}
      <motion.div
        ref={scriptContainerRef}
        className="mb-6 relative"
        style={{
          background: '#f4f0e8',
          color: '#1a1812',
          borderRadius: '4px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)',
          padding: isDesktop ? '2.5rem 3rem' : '1.5rem 1.25rem',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* LIVE indicator — top right of paper */}
        <div style={{ position: 'absolute', top: isDesktop ? '1.25rem' : '0.75rem', right: isDesktop ? '1.5rem' : '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-stage-red, #c23b22)',
              display: 'inline-block',
              animation: 'pulse-live 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-stage-red, #c23b22)' }}>LIVE</span>
        </div>
        <style>{`@keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        {/* Script title on paper */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: isDesktop ? '1.75rem' : '1.35rem', fontWeight: 700, color: '#1a1812', margin: 0 }}>
            {script.title}
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '11px', color: '#8a8478', marginTop: '4px', letterSpacing: '0.05em' }}>
            A Plot Twists Original
          </p>
          <p style={{ fontSize: '10px', color: '#a09a8e', marginTop: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {getCharactersInScene(script).join(' \u00B7 ')}
          </p>
        </div>

        {/* Progress bar on paper */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a09a8e' }}>
              Line {currentLineIndex + 1} of {script.lines.length}
            </span>
          </div>
          <div style={{ height: '2px', borderRadius: '1px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: '1px', background: 'var(--color-stage-red, #c23b22)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${((currentLineIndex + 1) / script.lines.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Script lines — screenplay format */}
        <AnimatePresence mode="sync">
          {getVisibleLines(script.lines, currentLineIndex, teleprompterSettings).map(({ line, originalIndex }) => {
            const isCurrent = originalIndex === currentLineIndex
            const isPast = originalIndex < currentLineIndex
            const isFuture = originalIndex > currentLineIndex
            const moodIndicator = getMoodIndicator(line.mood)
            const isStageDirection = line.speaker?.toLowerCase() === 'stage direction' || line.speaker?.toLowerCase() === 'narrator'

            return (
              <motion.div
                key={originalIndex}
                className="mb-3"
                style={{
                  padding: isDesktop ? '12px 24px' : '10px 16px',
                  borderRadius: '2px',
                  background: isCurrent
                    ? 'linear-gradient(90deg, rgba(255,240,100,0.12) 0%, rgba(255,240,100,0.08) 70%, transparent 100%)'
                    : 'transparent',
                  borderLeft: isCurrent ? '2px solid rgba(194,59,34,0.3)' : '2px solid transparent',
                  opacity: isPast ? 0.15 : isFuture ? 0.25 : 1,
                  transition: 'background 0.2s, opacity 0.2s',
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: isPast ? 0.15 : isFuture ? 0.25 : 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                data-line-index={originalIndex}
              >
                {isStageDirection ? (
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: '#8a8478',
                    textAlign: 'center',
                  }}>
                    ({line.text})
                  </p>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: isCurrent ? '13px' : '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: isCurrent ? 'var(--color-stage-gold, #b8860b)' : '#5a5548',
                      }}>
                        {line.speaker}
                      </span>
                      {isCurrent && moodIndicator.label !== 'Neutral' && (
                        <motion.span
                          style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            fontSize: '10px',
                            fontWeight: 500,
                            padding: '1px 8px',
                            borderRadius: '8px',
                            background: `${moodIndicator.color}18`,
                            color: moodIndicator.color,
                            border: `1px solid ${moodIndicator.color}30`,
                            verticalAlign: 'middle',
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={SPRING}
                        >
                          {moodIndicator.label}
                        </motion.span>
                      )}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: isCurrent ? '19px' : '16px',
                      lineHeight: 1.6,
                      color: isCurrent ? '#1a1812' : '#5a5548',
                      textAlign: 'center',
                      maxWidth: '380px',
                      margin: '0 auto',
                    }}>
                      {line.text}
                    </p>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Page number */}
        <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '10px', color: '#b0a99c', fontFamily: 'var(--font-mono)' }}>
          {currentLineIndex + 1}
        </div>
      </motion.div>

      {/* Controls — dark surface below the paper */}
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
            onClick={() => { tapHaptic(); togglePlayPause() }}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              color: !isPlaying ? '#ff6b6b' : 'var(--color-theater-text)',
              background: !isPlaying ? 'rgba(255, 107, 107, 0.1)' : 'rgba(253, 252, 250, 0.08)',
              border: !isPlaying ? '1px solid rgba(255, 107, 107, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
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
            onClick={() => { tapHaptic(); nextLine() }}
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
            onClick={() => { tapHaptic(); triggerChaos() }}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => { tapHaptic(); endPerformance() }}
              style={{ color: 'var(--color-theater-bg)' }}
            >
              Finish Scene — Vote
            </Button>
          </motion.div>
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
