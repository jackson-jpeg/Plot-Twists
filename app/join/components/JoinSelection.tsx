'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { CardSelection, PlayerRole, AvailableCards, Player } from '@/lib/types'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon, SpinnerIcon, PopcornIcon } from '@/components/GameIcons'

const CardPicker = dynamic(
  () => import('@/components/CardPicker').then(m => ({ default: m.CardPicker })),
  { ssr: false, loading: () => null }
)

export interface JoinSelectionProps {
  myRole: PlayerRole
  hasSubmitted: boolean
  isSubmitting: boolean
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  availableCards: AvailableCards
  roomIsMature: boolean
  error: string
  players: Player[]
  onSubmitCards: () => void
  onBack?: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function JoinSelection({
  myRole, hasSubmitted, isSubmitting, selection, setSelection,
  availableCards, roomIsMature, error, players,
  onSubmitCards, onBack, toast,
}: JoinSelectionProps) {
  const pageTransitionVariants = VARIANTS.pageTransition
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const [confirmMode, setConfirmMode] = useState(false)

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

  // Spectator waiting
  if (myRole === 'SPECTATOR' && !hasSubmitted) {
    return (
      <motion.div
        key="spectator-waiting"
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center justify-center"
        style={{ minHeight: '100dvh', padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))', background: 'var(--color-bg)' }}
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
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '8px',
            }}
          >
            Grab Some Popcorn
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            The actors are picking their cards...
          </p>
          {nonHostPlayers.length > 0 && (
            <p className="mt-3 font-medium" style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
              {submittedCount}/{nonHostPlayers.length} players submitted
            </p>
          )}
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{ width: 8, height: 8, background: 'var(--color-accent)' }}
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
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center justify-center"
        style={{ minHeight: '100dvh', padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px))', background: 'var(--color-bg)' }}
      >
        <div className="w-full max-w-md text-center">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <CheckCircleIcon size={56} color="var(--color-success)" />
          </motion.div>
          <motion.h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-success)',
              marginBottom: '6px',
            }}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Cards Submitted!
          </motion.h1>
          <motion.p
            style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {nonHostPlayers.length > 0
              ? `${submittedCount}/${nonHostPlayers.length} players submitted`
              : 'Waiting for others...'}
          </motion.p>

          {/* Selected cards recap */}
          {(selection.character || selection.setting || selection.circumstance) && (
            <motion.div
              className="p-4 rounded-xl text-left"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--color-text-tertiary)',
                marginBottom: '10px',
              }}>
                Your Scene
              </p>
              <div className="flex flex-col gap-2">
                {selection.character && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Character</span>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.character}</span>
                  </div>
                )}
                {selection.setting && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Setting</span>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.setting}</span>
                  </div>
                )}
                {selection.circumstance && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Wild Card</span>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.circumstance}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Waiting dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{ width: 8, height: 8, background: 'var(--color-success)' }}
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
    if (availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
      setSelection({
        character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
        setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
        circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
      })
      tapHaptic()
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50])
    }
  }

  const allSelected = selection.character && selection.setting && selection.circumstance

  // Card picker
  return (
    <motion.div
      key="selection"
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: '24px 16px', background: 'var(--color-bg)' }}
    >
      <div className="w-full mx-auto" style={{ maxWidth: isDesktop ? '600px' : undefined, position: 'relative' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              top: 'calc(12px + env(safe-area-inset-top, 0px))',
              left: 12,
              zIndex: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
            }}
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
            availableCards={availableCards}
            onShuffleAll={handleShuffleAll}
            toast={toast}
          />

          {error && (
            <div className="p-3 rounded-lg mt-4 text-center" style={{ background: 'var(--color-danger)', color: 'white' }}>
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          <motion.button
            onClick={handleSubmit}
            disabled={!allSelected || isSubmitting}
            className="w-full mt-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: confirmMode
                ? 'var(--color-success)'
                : allSelected && !isSubmitting
                ? 'var(--color-accent)'
                : 'var(--color-surface-alt)',
              color: allSelected && !isSubmitting ? 'white' : 'var(--color-text-tertiary)',
              cursor: allSelected && !isSubmitting ? 'pointer' : 'not-allowed',
              opacity: allSelected && !isSubmitting ? 1 : 0.6,
              transition: 'background 0.2s, opacity 0.2s',
            }}
            whileHover={!isSubmitting && allSelected ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && allSelected ? { scale: 0.98 } : {}}
            animate={(allSelected && !isSubmitting && !confirmMode && !prefersReducedMotion)
              ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0.1)', '0 0 0 8px rgba(245, 158, 66, 0.15)', '0 0 0 0 rgba(245, 158, 66, 0.1)'] }
              : {}}
            transition={(allSelected && !isSubmitting && !confirmMode && !prefersReducedMotion)
              ? { duration: 2, repeat: Infinity }
              : {}}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon size={16} color="currentColor" />
                Submitting...
              </span>
            ) : confirmMode ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircleIcon size={16} color="currentColor" />
                Tap again to confirm
              </span>
            ) : (
              <span>
                {!allSelected
                  ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)`
                  : 'Submit Cards — Ready!'}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
