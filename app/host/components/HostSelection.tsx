'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
const CardPicker = dynamic(() => import('@/components/CardPicker').then(m => ({ default: m.CardPicker })), { ssr: false, loading: () => null })
import { SPRING, SPRING_GENTLE, SPRING_BOUNCY, ENTER_Y, PRESS, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon, SpinnerIcon, StatusDot } from '@/components/GameIcons'
import { Button, Card, Avatar } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useAudienceStore } from '@/stores/audienceStore'

const IMPROV_TIPS = [
  { tip: '"Yes, and..." -- always build on what your scene partner gives you.' },
  { tip: 'Commit fully to your character. Go big or go home!' },
  { tip: 'Listen more than you talk. The best comedy comes from reacting.' },
  { tip: "Don't be afraid to move! Physicality makes scenes pop." },
  { tip: 'Make your scene partner look good -- it makes the whole scene better.' },
  { tip: 'Play at the top of your intelligence. Dumb characters can be smart about being dumb.' },
]

export interface HostSelectionProps {
  onSubmitSoloCards: () => void
  onBackToLobby: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function HostSelection({
  onSubmitSoloCards, onBackToLobby, toast,
}: HostSelectionProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const settings = useGameStore((s) => s.settings)
  const players = useGameStore((s) => s.players)
  const selection = useSelectionStore((s) => s.selection)
  const setSelection = useSelectionStore((s) => s.setSelection)
  const hasSubmittedSelection = useSelectionStore((s) => s.hasSubmitted)
  const isSubmittingCards = useSelectionStore((s) => s.isSubmitting)
  const availableCards = useSelectionStore((s) => s.availableCards)
  const greenRoomQuestion = useAudienceStore((s) => s.greenRoomQuestion)

  const nonHostPlayers = players.filter(p => !p.isHost)
  const readyCount = nonHostPlayers.filter(p => p.hasSubmittedSelection).length
  const [tipIndex, setTipIndex] = useState(0)
  const [confirmMode, setConfirmMode] = useState(false)

  const gameMode = settings?.gameMode ?? 'ENSEMBLE'
  const isMature = settings?.isMature ?? false

  // Auto-reset confirmMode after 3 seconds
  useEffect(() => {
    if (!confirmMode) return
    const timer = setTimeout(() => setConfirmMode(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmMode])

  const handleSoloSubmit = useCallback(() => {
    if (!confirmMode) {
      setConfirmMode(true)
      tapHaptic()
      return
    }
    setConfirmMode(false)
    onSubmitSoloCards()
  }, [confirmMode, onSubmitSoloCards])

  // Cycle through improv tips
  useEffect(() => {
    if (gameMode === 'SOLO') return
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % IMPROV_TIPS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [gameMode])

  const allSelected = selection.character && selection.setting && selection.circumstance
  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length

  // Solo mode - submitted waiting view
  if (gameMode === 'SOLO' && hasSubmittedSelection) {
    return (
      <motion.div
        key="solo-waiting"
        {...ENTER_Y}
        exit={{ opacity: 0, y: -10 }}
        transition={SPRING_GENTLE}
        className="w-full max-w-lg mx-auto px-5 text-center"
      >
        <Card padding="lg">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING_BOUNCY}
          >
            <CheckCircleIcon size={64} color="var(--color-success)" />
          </motion.div>

          <motion.h1
            className="text-[32px] font-bold mb-3 text-[var(--color-success)]"
            style={{ fontFamily: 'var(--font-display)' }}
            {...ENTER_Y}
            transition={{ ...SPRING_GENTLE, delay: 0.2 }}
          >
            Cards Submitted!
          </motion.h1>

          <motion.p
            className="text-[17px] text-[var(--color-text-secondary)] mb-5"
            {...ENTER_Y}
            transition={{ ...SPRING_GENTLE, delay: 0.3 }}
          >
            Generating your scene...
          </motion.p>

          <motion.div
            className="p-4 rounded-xl text-left bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
            {...ENTER_Y}
            transition={{ ...SPRING_GENTLE, delay: 0.4 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--color-text-tertiary)] mb-2.5">
              Your Scene
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Character</span>
                <span className="text-sm text-[var(--color-text-primary)]">{selection.character}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Setting</span>
                <span className="text-sm text-[var(--color-text-primary)]">{selection.setting}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Wild Card</span>
                <span className="text-sm text-[var(--color-text-primary)]">{selection.circumstance}</span>
              </div>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    )
  }

  // Solo mode - card picker
  if (gameMode === 'SOLO') {
    const handleShuffleAll = () => {
      if (availableCards && availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
        setSelection({
          character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
          setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
          circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
        })
      }
    }

    return (
      <motion.div
        key="solo-selection"
        {...ENTER_Y}
        exit={{ opacity: 0, y: -10 }}
        transition={SPRING_GENTLE}
        className="w-full mx-auto px-5"
        style={{ maxWidth: isDesktop ? '900px' : '672px', background: 'var(--color-void)', minHeight: '100dvh' }}
      >
        <motion.button
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 mb-4 bg-transparent border-none cursor-pointer text-[15px] py-2 px-1"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -4 }}
          {...PRESS}
          transition={SPRING}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Back to Lobby</span>
        </motion.button>

        <div>
          {!availableCards || availableCards.characters.length === 0 ? (
            <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SpinnerIcon size={32} color="rgba(255,255,255,0.5)" className={prefersReducedMotion ? '' : ''} />
              <p className="mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading cards...</p>
            </motion.div>
          ) : (
            <>
              <CardPicker
                selection={selection}
                setSelection={(s) => setSelection(s)}
                isMature={isMature}
                availableCards={availableCards}
                onShuffleAll={handleShuffleAll}
                toast={toast}
              />

              {/* Fixed bottom submit */}
              <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] z-30" style={{ background: 'var(--color-void)' }}>
                <Button
                  fullWidth
                  size="lg"
                  variant={confirmMode ? 'primary' : 'primary'}
                  loading={isSubmittingCards}
                  disabled={!allSelected || isSubmittingCards}
                  onClick={handleSoloSubmit}
                  style={confirmMode ? { background: 'var(--color-success)' } : allSelected ? { background: '#fff', color: '#1a1812' } : undefined}
                >
                  {isSubmittingCards ? (
                    'Submitting...'
                  ) : confirmMode ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircleIcon size={16} color="currentColor" />
                      Tap again to confirm
                    </span>
                  ) : !allSelected ? (
                    `Pick ${3 - selectedCount} more`
                  ) : (
                    'Lock In Cards'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
        {/* Spacer for fixed bottom button */}
        <div className="h-24" />
      </motion.div>
    )
  }

  // Ensemble/H2H - enriched waiting screen
  const currentTip = IMPROV_TIPS[tipIndex]

  return (
    <motion.div
      key="selection"
      {...ENTER_Y}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="w-full max-w-2xl mx-auto px-5 text-center"
    >
      <motion.h1
        className="text-3xl sm:text-4xl font-bold mb-2 text-[var(--color-text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={SPRING}
      >
        Pick your cards
      </motion.h1>

      <motion.p
        className="text-sm mb-6 text-[var(--color-text-tertiary)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING_GENTLE, delay: 0.1 }}
      >
        Everyone picks a character, setting, and wild card
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="mb-6"
        {...ENTER_Y}
        transition={{ ...SPRING_GENTLE, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Players</span>
          <span
            className="text-sm font-bold"
            style={{ color: readyCount === nonHostPlayers.length ? 'var(--color-success)' : 'var(--color-text-primary)' }}
          >
            {readyCount}/{nonHostPlayers.length} ready
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--color-surface-alt)]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: readyCount === nonHostPlayers.length
                ? 'var(--color-success)'
                : 'var(--color-accent)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: nonHostPlayers.length > 0 ? `${(readyCount / nonHostPlayers.length) * 100}%` : '0%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Player list */}
      <div className="mb-4">
        <div className="space-y-2">
          {nonHostPlayers.map((player, i) => {
            const status = player.hasSubmittedSelection ? 'done' : 'waiting'
            return (
              <motion.div
                key={player.publicId}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-alt)]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: i * STAGGER }}
              >
                <div className="flex items-center gap-3">
                  {status === 'done' ? (
                    <CheckCircleIcon size={20} color="var(--color-success)" />
                  ) : (
                    <StatusDot status="waiting" size={20} />
                  )}
                  <Avatar name={player.nickname} size="sm" />
                  <span className="font-semibold text-[var(--color-text-primary)]">{player.nickname}</span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: player.hasSubmittedSelection ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {player.hasSubmittedSelection ? '3/3 cards' : 'Waiting'}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Deck stats */}
      {availableCards && availableCards.characters.length > 0 && (
        <motion.div
          className="flex justify-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING_GENTLE, delay: 0.2 }}
        >
          {[
            { count: availableCards.characters.length, label: 'characters' },
            { count: availableCards.settings.length, label: 'settings' },
            { count: availableCards.circumstances.length, label: 'twists' },
          ].map(({ count, label }) => (
            <div key={label} className="text-center px-3 py-1.5 rounded-xl bg-[var(--color-surface-alt)]">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{count}</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Green room question */}
      {greenRoomQuestion && (
        <motion.div
          className="mb-4 text-left p-4 rounded-xl bg-[var(--color-highlight)] border border-[var(--color-accent)]"
          {...ENTER_Y}
          transition={{ ...SPRING_GENTLE, delay: 0.3 }}
        >
          <div>
            <p className="text-xs font-semibold mb-1 uppercase tracking-wider text-[var(--color-text-tertiary)]">GREEN ROOM</p>
            <p className="text-sm text-[var(--color-text-primary)]">{greenRoomQuestion}</p>
          </div>
        </motion.div>
      )}

      {/* Cycling improv tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING_GENTLE, delay: 0.4 }}
      >
        <Card>
          <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider text-[var(--color-text-tertiary)]">Improv Tip</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-left text-[var(--color-text-secondary)]"
            >
              {currentTip.tip}
            </motion.p>
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  )
}
