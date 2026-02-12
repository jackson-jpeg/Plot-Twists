'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { CardSelection, PlayerRole, AvailableCards } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'

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
  toast: { success: (m: string) => void }
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
          <div className="text-8xl mb-6">🍿</div>
          <h1 className="text-3xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>Grab Some Popcorn</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Waiting for the actors to pick their cards...</p>
        </div>
      </motion.div>
    )
  }

  // Submitted waiting
  if (hasSubmitted) {
    return (
      <motion.div key="waiting" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
        <div className="card">
          <div className="text-8xl mb-6">✓</div>
          <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>Submitted!</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Waiting for others...</p>
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
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50])
    }
  }

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
          disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmitting}
          className="btn btn-primary btn-large w-full mt-6"
          style={{ opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmitting) ? 0.5 : 1 }}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          animate={(selection.character && selection.setting && selection.circumstance && !isSubmitting)
            ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0)', '0 0 0 10px rgba(245, 158, 66, 0)', '0 0 0 0 rgba(245, 158, 66, 0)'] } : {}}
          transition={(selection.character && selection.setting && selection.circumstance && !isSubmitting) ? { duration: 2, repeat: Infinity } : {}}
        >
          {isSubmitting ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span><span>Submitting...</span></>
          ) : (
            <><span>✨</span><span>{(!selection.character || !selection.setting || !selection.circumstance) ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)` : 'Submit Cards - Ready!'}</span></>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
