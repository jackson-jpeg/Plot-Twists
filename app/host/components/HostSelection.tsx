'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Player, RoomSettings, CardSelection, AvailableCards } from '@/lib/types'
import { CardPicker } from '@/components/CardPicker'
import { VARIANTS } from '@/lib/animations'
import { tapHaptic } from '@/hooks/useHaptics'

const IMPROV_TIPS = [
  { emoji: '🎭', tip: '"Yes, and..." — always build on what your scene partner gives you.' },
  { emoji: '🎤', tip: 'Commit fully to your character. Go big or go home!' },
  { emoji: '👀', tip: 'Listen more than you talk. The best comedy comes from reacting.' },
  { emoji: '🤸', tip: 'Don\'t be afraid to move! Physicality makes scenes pop.' },
  { emoji: '💡', tip: 'Make your scene partner look good — it makes the whole scene better.' },
  { emoji: '🎪', tip: 'Play at the top of your intelligence. Dumb characters can be smart about being dumb.' },
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
      <motion.div key="solo-waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
        <div className="card">
          <motion.div className="text-8xl mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>✅</motion.div>
          <motion.h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>Cards Submitted!</motion.h1>
          <motion.p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>Generating your scene...</motion.p>
          <motion.div className="p-4 rounded-lg text-left" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SCENE:</p>
            <div className="space-y-2 text-sm">
              <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🎭</span> {selection.character}</p>
              <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🏛️</span> {selection.setting}</p>
              <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">⚡</span> {selection.circumstance}</p>
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
      <motion.div key="solo-selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl">
        <motion.button onClick={onBackToLobby} className="back-button mb-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
          <span className="back-arrow">←</span><span>Back to Lobby</span>
        </motion.button>

        <div className="card">
          {availableCards.characters.length === 0 ? (
            <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="text-4xl mb-4" animate={prefersReducedMotion ? {} : { rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🎴</motion.div>
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</p>
            </motion.div>
          ) : (
            <>
              <CardPicker
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
                className="btn btn-primary btn-large w-full mt-6"
                style={{
                  opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards) ? 0.6 : 1,
                  ...(confirmMode ? { background: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}),
                }}
                whileHover={{ scale: isSubmittingCards ? 1 : 1.02 }} whileTap={{ scale: isSubmittingCards ? 1 : 0.98 }}
                animate={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards && !confirmMode && !prefersReducedMotion) ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0.1)', '0 0 0 8px rgba(245, 158, 66, 0.15)', '0 0 0 0 rgba(245, 158, 66, 0.1)'] } : {}}
                transition={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards && !confirmMode && !prefersReducedMotion) ? { duration: 2, repeat: Infinity } : {}}
              >
                {isSubmittingCards ? (
                  <><motion.span animate={prefersReducedMotion ? {} : { rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span><span>Submitting...</span></>
                ) : confirmMode ? (
                  <><span>✅</span><span>Tap again to confirm</span></>
                ) : (
                  <><span>✨</span><span>{(!selection.character || !selection.setting || !selection.circumstance) ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)` : 'Submit Cards - Ready!'}</span></>
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
    <motion.div key="selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl text-center">
      <motion.h1 className="hero-title mb-6" initial={{ y: -20 }} animate={{ y: 0 }}>🎴 Selecting Cards</motion.h1>

      {/* Progress bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Players ready</span>
          <span className="text-sm font-bold" style={{ color: readyCount === nonHostPlayers.length ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
            {readyCount}/{nonHostPlayers.length}
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: readyCount === nonHostPlayers.length
                ? 'var(--color-success)'
                : 'linear-gradient(90deg, var(--color-purple), var(--color-pink))'
            }}
            initial={{ width: '0%' }}
            animate={{ width: nonHostPlayers.length > 0 ? `${(readyCount / nonHostPlayers.length) * 100}%` : '0%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Player list */}
      <div className="card mb-4">
        <div className="stack-sm">
          {nonHostPlayers.map((player, i) => (
            <motion.div key={player.id} className="split p-4 rounded-lg" style={{ background: 'var(--color-surface-alt)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-2">
                <div className="player-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{player.nickname[0]?.toUpperCase()}</div>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
              </div>
              <motion.span className={`text-sm font-medium badge ${player.hasSubmittedSelection ? 'badge-success' : 'badge-warning'}`} animate={player.hasSubmittedSelection || prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                {player.hasSubmittedSelection ? '✓ Ready' : '⏳ Selecting'}
              </motion.span>
            </motion.div>
          ))}
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
              <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Green room question */}
      {greenRoomQuestion && (
        <motion.div
          className="card mb-4 text-left"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-accent)' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-tertiary)' }}>GREEN ROOM</p>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{greenRoomQuestion}</p>
            </div>
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
        <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Improv Tip</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2"
          >
            <span className="text-lg">{currentTip.emoji}</span>
            <p className="text-sm text-left" style={{ color: 'var(--color-text-secondary)' }}>{currentTip.tip}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
