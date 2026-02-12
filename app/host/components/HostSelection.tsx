'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player, RoomSettings, CardSelection, AvailableCards } from '@/lib/types'
import { CardPicker } from '@/components/CardPicker'
import { VARIANTS } from '@/lib/animations'

export interface HostSelectionProps {
  settings: RoomSettings
  players: Player[]
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  hasSubmittedSelection: boolean
  isSubmittingCards: boolean
  availableCards: AvailableCards
  onSubmitSoloCards: () => void
  onBackToLobby: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function HostSelection({
  settings, players, selection, setSelection,
  hasSubmittedSelection, isSubmittingCards, availableCards,
  onSubmitSoloCards, onBackToLobby, toast,
}: HostSelectionProps) {
  const pageTransitionVariants = VARIANTS.pageTransition
  const nonHostPlayers = players.filter(p => !p.isHost)

  // Solo mode - submitted waiting view
  if (settings.gameMode === 'SOLO' && hasSubmittedSelection) {
    return (
      <motion.div key="solo-waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
        <div className="card">
          <motion.div className="text-8xl mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>✓</motion.div>
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
              <motion.div className="text-4xl mb-4" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🎴</motion.div>
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
                onClick={onSubmitSoloCards}
                disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards}
                className="btn btn-primary btn-large w-full mt-6"
                style={{ opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards) ? 0.6 : 1 }}
                whileHover={{ scale: isSubmittingCards ? 1 : 1.02 }} whileTap={{ scale: isSubmittingCards ? 1 : 0.98 }}
                animate={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0.1)', '0 0 0 8px rgba(245, 158, 66, 0.15)', '0 0 0 0 rgba(245, 158, 66, 0.1)'] } : {}}
                transition={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? { duration: 2, repeat: Infinity } : {}}
              >
                {isSubmittingCards ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span><span>Submitting...</span></>
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

  // Ensemble/H2H - player ready status
  return (
    <motion.div key="selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl text-center">
      <motion.h1 className="hero-title mb-12" initial={{ y: -20 }} animate={{ y: 0 }}>🎴 Selecting Cards</motion.h1>
      <div className="card">
        <div className="stack-sm">
          {nonHostPlayers.map((player, i) => (
            <motion.div key={player.id} className="split p-4 rounded-lg" style={{ background: 'var(--color-surface-alt)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
              <motion.span className={`text-sm font-medium badge ${player.hasSubmittedSelection ? 'badge-success' : 'badge-warning'}`} animate={player.hasSubmittedSelection ? {} : { scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                {player.hasSubmittedSelection ? '✓ Ready' : '⏳ Selecting'}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
