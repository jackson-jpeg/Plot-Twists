'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { PlayerRole } from '@/lib/types'
import { SPRING, SPRING_GENTLE, SPRING_BOUNCY, ENTER_Y, PRESS, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon, SpinnerIcon, PopcornIcon } from '@/components/GameIcons'
import { Button, Card } from '@/components/ui'
import { useSelectionStore } from '@/stores/selectionStore'
import { useGameStore } from '@/stores/gameStore'
import { useConnectionStore } from '@/stores/connectionStore'

const CardPicker = dynamic(
  () => import('@/components/CardPicker').then(m => ({ default: m.CardPicker })),
  { ssr: false, loading: () => null }
)

export interface JoinSelectionProps {
  myRole: PlayerRole
  roomIsMature: boolean
  onSubmitCards: () => void
  onBack?: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function JoinSelection({
  myRole, roomIsMature, onSubmitCards, onBack, toast,
}: JoinSelectionProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const [confirmMode, setConfirmMode] = useState(false)

  // Store selectors
  const selection = useSelectionStore((s) => s.selection)
  const setSelection = useSelectionStore((s) => s.setSelection)
  const hasSubmitted = useSelectionStore((s) => s.hasSubmitted)
  const isSubmitting = useSelectionStore((s) => s.isSubmitting)
  const availableCards = useSelectionStore((s) => s.availableCards)
  const players = useGameStore((s) => s.players)
  const error = useConnectionStore((s) => s.error)

  useEffect(() => {
    if (!confirmMode) return
    const timer = setTimeout(() => setConfirmMode(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmMode])

  const handleSubmit = useCallback(() => {
    if (!confirmMode) {
      setConfirmMode(true)
      tapHaptic()
      return
    }
    setConfirmMode(false)
    onSubmitCards()
  }, [confirmMode, onSubmitCards])

  const nonHostPlayers = players.filter(p => !p.isHost && p.role === 'PLAYER')
  const submittedCount = nonHostPlayers.filter(p => p.hasSubmittedSelection).length

  const allSelected = selection.character && selection.setting && selection.circumstance
  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length

  // Spectator waiting
  if (myRole === 'SPECTATOR' && !hasSubmitted) {
    return (
      <motion.div
        key="spectator-waiting"
        {...ENTER_Y}
        transition={SPRING_GENTLE}
        className="flex flex-col items-center justify-center min-h-dvh bg-[var(--color-bg)]"
        style={{ padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md text-center">
          <motion.div
            className="flex justify-center mb-5"
            animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PopcornIcon size={56} color="var(--color-accent)" />
          </motion.div>

          <h1
            className="text-[28px] font-bold mb-2 text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Grab Some Popcorn
          </h1>

          <p className="text-base text-[var(--color-text-secondary)]">
            The actors are picking their cards...
          </p>

          {nonHostPlayers.length > 0 && (
            <p className="mt-3 font-medium text-sm text-[var(--color-text-tertiary)]">
              {submittedCount}/{nonHostPlayers.length} players submitted
            </p>
          )}

          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
                animate={prefersReducedMotion ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // Submitted waiting
  if (hasSubmitted) {
    return (
      <motion.div
        key="waiting"
        {...ENTER_Y}
        transition={SPRING_GENTLE}
        className="flex flex-col items-center justify-center min-h-dvh bg-[var(--color-bg)]"
        style={{ padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-md text-center">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING_BOUNCY}
          >
            <CheckCircleIcon size={56} color="var(--color-success)" />
          </motion.div>

          <motion.h1
            className="text-[28px] font-bold mb-1.5 text-[var(--color-success)]"
            style={{ fontFamily: 'var(--font-display)' }}
            {...ENTER_Y}
            transition={{ ...SPRING_GENTLE, delay: 0.15 }}
          >
            Cards Submitted!
          </motion.h1>

          <motion.p
            className="text-[15px] text-[var(--color-text-secondary)] mb-5"
            {...ENTER_Y}
            transition={{ ...SPRING_GENTLE, delay: 0.25 }}
          >
            {nonHostPlayers.length > 0
              ? `${submittedCount}/${nonHostPlayers.length} players submitted`
              : 'Waiting for others...'}
          </motion.p>

          {/* Selected cards recap */}
          {(selection.character || selection.setting || selection.circumstance) && (
            <motion.div
              className="text-left"
              {...ENTER_Y}
              transition={{ ...SPRING_GENTLE, delay: 0.35 }}
            >
              <Card className="bg-[var(--color-surface-alt)]">
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--color-text-tertiary)] mb-2.5">
                  Your Scene
                </p>
                <div className="flex flex-col gap-2">
                  {selection.character && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Character</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{selection.character}</span>
                    </div>
                  )}
                  {selection.setting && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Setting</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{selection.setting}</span>
                    </div>
                  )}
                  {selection.circumstance && (
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)] min-w-[70px]">Wild Card</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{selection.circumstance}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Waiting dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--color-success)]"
                animate={prefersReducedMotion ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  const handleShuffleAll = () => {
    if (availableCards && availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
      setSelection({
        character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
        setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
        circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
      })
      tapHaptic()
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50])
    }
  }

  // Card picker
  return (
    <motion.div
      key="selection"
      {...ENTER_Y}
      transition={SPRING_GENTLE}
      style={{ background: 'var(--color-void)', padding: '24px 16px', minHeight: '100dvh' }}
    >
      <div className="w-full mx-auto relative" style={{ maxWidth: isDesktop ? '600px' : undefined }}>
        {onBack && (
          <button
            onClick={onBack}
            className="absolute z-20 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))', left: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            aria-label="Close card picker"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div>
          <CardPicker
            selection={selection}
            setSelection={(s) => setSelection(s)}
            isMature={roomIsMature}
            availableCards={availableCards ?? { characters: [], settings: [], circumstances: [] }}
            onShuffleAll={handleShuffleAll}
            toast={toast}
          />

          {error && (
            <div className="p-3 rounded-xl mt-4 text-center bg-[var(--color-danger)] text-white">
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Fixed bottom submit */}
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] z-30" style={{ background: 'var(--color-void)' }}>
            <Button
              fullWidth
              size="lg"
              variant="primary"
              loading={isSubmitting}
              disabled={!allSelected || isSubmitting}
              onClick={handleSubmit}
              style={confirmMode ? { background: 'var(--color-success)' } : allSelected ? { background: '#fff', color: '#1a1812' } : undefined}
            >
              {isSubmitting ? (
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
        </div>

        {/* Spacer for fixed bottom button */}
        <div className="h-24" />
      </div>
    </motion.div>
  )
}
