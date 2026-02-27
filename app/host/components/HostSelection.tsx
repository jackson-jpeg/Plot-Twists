'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Player, RoomSettings, CardSelection, AvailableCards } from '@/lib/types'
import dynamic from 'next/dynamic'
const CardSwipeStack = dynamic(() => import('@/components/CardSwipeStack').then(m => ({ default: m.CardSwipeStack })), { ssr: false, loading: () => <div style={{ minHeight: '100dvh', background: '#080808' }} /> })
import { VARIANTS } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon, SpinnerIcon, StatusDot } from '@/components/GameIcons'

const IMPROV_TIPS = [
  { tip: '"Yes, and..." -- always build on what your scene partner gives you.' },
  { tip: 'Commit fully to your character. Go big or go home!' },
  { tip: 'Listen more than you talk. The best comedy comes from reacting.' },
  { tip: "Don't be afraid to move! Physicality makes scenes pop." },
  { tip: 'Make your scene partner look good -- it makes the whole scene better.' },
  { tip: 'Play at the top of your intelligence. Dumb characters can be smart about being dumb.' },
]

export interface HostSelectionProps {
  settings: RoomSettings
  players: Player[]
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  hasSubmittedSelection: boolean
  isSubmittingCards: boolean
  availableCards: AvailableCards
  greenRoomQuestion: string | null
  onSubmitSoloCards: () => void
  onBackToLobby: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function HostSelection({
  settings, players, selection, setSelection,
  hasSubmittedSelection, isSubmittingCards, availableCards,
  greenRoomQuestion,
  onSubmitSoloCards, onBackToLobby, toast,
}: HostSelectionProps) {
  const pageTransitionVariants = VARIANTS.pageTransition
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const nonHostPlayers = players.filter(p => !p.isHost)
  const readyCount = nonHostPlayers.filter(p => p.hasSubmittedSelection).length
  const [tipIndex, setTipIndex] = useState(0)
  const [confirmMode, setConfirmMode] = useState(false)

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
    if (settings.gameMode === 'SOLO') return
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % IMPROV_TIPS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [settings.gameMode])

  // Solo mode - submitted waiting view
  if (settings.gameMode === 'SOLO' && hasSubmittedSelection) {
    return (
      <motion.div key="solo-waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-lg mx-auto px-5 text-center">
        <div className="p-6 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <motion.div className="flex justify-center mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <CheckCircleIcon size={64} color="var(--color-success)" />
          </motion.div>
          <motion.h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '12px' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>Cards Submitted!</motion.h1>
          <motion.p style={{ fontSize: '17px', color: 'var(--color-text-secondary)', marginBottom: '20px' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>Generating your scene...</motion.p>
          <motion.div className="p-4 rounded-xl text-left" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>Your Scene</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Character</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.character}</span>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Setting</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.setting}</span>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', minWidth: '70px' }}>Wild Card</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{selection.circumstance}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Solo mode - card picker
  if (settings.gameMode === 'SOLO') {
    const handleShuffleAll = () => {
      if (availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
        setSelection({
          character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
          setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
          circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
        })
      }
    }

    return (
      <motion.div key="solo-selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="w-full mx-auto px-5" style={{ maxWidth: isDesktop ? '900px' : '672px' }}>
        <motion.button
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 mb-4"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '15px', padding: '8px 4px' }}
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Back to Lobby</span>
        </motion.button>

        <div className="p-5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {availableCards.characters.length === 0 ? (
            <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SpinnerIcon size={32} color="var(--color-text-secondary)" className={prefersReducedMotion ? '' : ''} />
              <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</p>
            </motion.div>
          ) : (
            <>
              <CardSwipeStack
                selection={selection}
                setSelection={(s) => setSelection(s)}
                isMature={settings.isMature}
                availableCards={availableCards}
                onShuffleAll={handleShuffleAll}
                toast={toast}
              />

              <motion.button
                onClick={handleSoloSubmit}
                disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards}
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
                    : (selection.character && selection.setting && selection.circumstance && !isSubmittingCards)
                    ? 'var(--color-accent)'
                    : 'var(--color-surface-alt)',
                  color: (selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? 'white' : 'var(--color-text-tertiary)',
                  cursor: (selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? 'pointer' : 'not-allowed',
                  opacity: (selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? 1 : 0.6,
                }}
                whileHover={{ scale: isSubmittingCards ? 1 : 1.02 }} whileTap={{ scale: isSubmittingCards ? 1 : 0.98 }}
                animate={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards && !confirmMode && !prefersReducedMotion) ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0.1)', '0 0 0 8px rgba(245, 158, 66, 0.15)', '0 0 0 0 rgba(245, 158, 66, 0.1)'] } : {}}
                transition={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards && !confirmMode && !prefersReducedMotion) ? { duration: 2, repeat: Infinity } : {}}
              >
                {isSubmittingCards ? (
                  <span className="flex items-center justify-center gap-2"><SpinnerIcon size={16} color="currentColor" />Submitting...</span>
                ) : confirmMode ? (
                  <span className="flex items-center justify-center gap-2"><CheckCircleIcon size={16} color="currentColor" />Tap again to confirm</span>
                ) : (
                  <span>{(!selection.character || !selection.setting || !selection.circumstance) ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)` : 'Submit Cards — Ready!'}</span>
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  // Ensemble/H2H - enriched waiting screen
  const currentTip = IMPROV_TIPS[tipIndex]

  return (
    <motion.div key="selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-2xl mx-auto px-5 text-center">
      <motion.h1
        className="text-3xl sm:text-4xl font-display font-bold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        Pick your cards
      </motion.h1>
      <motion.p
        className="text-sm mb-6"
        style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Everyone picks a character, setting, and wild card
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Players</span>
          <span className="text-sm font-bold" style={{ color: readyCount === nonHostPlayers.length ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
            {readyCount}/{nonHostPlayers.length} ready
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
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
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--color-surface-alt)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  {status === 'done' ? (
                    <CheckCircleIcon size={20} color="var(--color-success)" />
                  ) : (
                    <StatusDot status="waiting" size={20} />
                  )}
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: '32px', height: '32px', fontSize: '13px', fontWeight: 700, background: 'var(--color-accent)', color: 'white' }}>{player.nickname[0]?.toUpperCase()}</div>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
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
      {availableCards.characters.length > 0 && (
        <motion.div
          className="flex justify-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { count: availableCards.characters.length, label: 'characters' },
            { count: availableCards.settings.length, label: 'settings' },
            { count: availableCards.circumstances.length, label: 'twists' },
          ].map(({ count, label }) => (
            <div key={label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
              <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{count}</div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Green room question */}
      {greenRoomQuestion && (
        <motion.div
          className="mb-4 text-left p-4 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-accent)' }}
        >
          <div>
            <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>GREEN ROOM</p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{greenRoomQuestion}</p>
          </div>
        </motion.div>
      )}

      {/* Cycling improv tips */}
      <motion.div
        className="p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Improv Tip</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-left"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {currentTip.tip}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
