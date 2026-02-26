'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { CardSelection, PlayerRole, AvailableCards } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { tapHaptic } from '@/hooks/useHaptics'

const CardPicker = dynamic(() => import('@/components/CardPicker').then(m => ({ default: m.CardPicker })), { ssr: false })

export interface JoinSelectionProps {
  myRole: PlayerRole
  hasSubmitted: boolean
  isSubmitting: boolean
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  availableCards: AvailableCards
  roomIsMature: boolean
  error: string
  onSubmitCards: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function JoinSelection({
  myRole, hasSubmitted, isSubmitting, selection, setSelection,
  availableCards, roomIsMature, error,
  onSubmitCards, toast,
}: JoinSelectionProps) {
  const pageTransitionVariants = VARIANTS.pageTransition

  // Spectator waiting
  if (myRole === 'SPECTATOR' && !hasSubmitted) {
    return (
      <motion.div key="spectator-waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
        <div className="card">
          <motion.div
            className="text-7xl mb-5"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🍿
          </motion.div>
          <h1 className="text-3xl font-display mb-3" style={{ color: 'var(--color-text-primary)' }}>Grab Some Popcorn</h1>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>The actors are picking their cards...</p>
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--color-accent)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // Submitted waiting — show selected cards
  if (hasSubmitted) {
    return (
      <motion.div key="waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
        <div className="card">
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            ✅
          </motion.div>
          <motion.h1
            className="text-3xl font-display mb-2"
            style={{ color: 'var(--color-success)' }}
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Cards Submitted!
          </motion.h1>
          <motion.p
            className="text-base mb-5"
            style={{ color: 'var(--color-text-secondary)' }}
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Waiting for others...
          </motion.p>

          {/* Show selected cards */}
          {(selection.character || selection.setting || selection.circumstance) && (
            <motion.div
              className="p-4 rounded-lg text-left"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SCENE:</p>
              <div className="space-y-2 text-sm">
                {selection.character && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold" aria-hidden="true">🎭</span> {selection.character}</p>}
                {selection.setting && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold" aria-hidden="true">🏛️</span> {selection.setting}</p>}
                {selection.circumstance && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold" aria-hidden="true">⚡</span> {selection.circumstance}</p>}
              </div>
            </motion.div>
          )}

          {/* Waiting dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--color-success)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
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
    <motion.div key="selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl">
      <div className="card">
        <CardPicker
          selection={selection}
          setSelection={(s) => setSelection(s)}
          isMature={roomIsMature}
          availableCards={availableCards}
          onShuffleAll={handleShuffleAll}
          toast={toast}
        />

        {error && (
          <div className="p-4 rounded-lg mt-4" style={{ background: 'var(--color-danger)', border: '2px solid var(--color-bg)' }}>
            <p className="text-white text-center font-semibold">⚠️ {error}</p>
          </div>
        )}

        <motion.button
          onClick={onSubmitCards}
          disabled={!allSelected || isSubmitting}
          className="btn btn-primary btn-large w-full mt-6"
          style={{ opacity: (!allSelected || isSubmitting) ? 0.5 : 1 }}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          animate={(allSelected && !isSubmitting)
            ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0.1)', '0 0 0 8px rgba(245, 158, 66, 0.15)', '0 0 0 0 rgba(245, 158, 66, 0.1)'] } : {}}
          transition={(allSelected && !isSubmitting) ? { duration: 2, repeat: Infinity } : {}}
        >
          {isSubmitting ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} aria-hidden="true">⏳</motion.span><span>Submitting...</span></>
          ) : (
            <><span aria-hidden="true">✨</span><span>{!allSelected ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)` : 'Submit Cards - Ready!'}</span></>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
