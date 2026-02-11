'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { CardSelection, PlayerRole, AvailableCards } from '@/lib/types'
import { VARIANTS, MOTION } from '@/lib/animations'

const SmartCardSelector = dynamic(() => import('@/components/SmartCardSelector').then(m => ({ default: m.SmartCardSelector })), { ssr: false })

export interface JoinSelectionProps {
  myRole: PlayerRole
  hasSubmitted: boolean
  isSubmitting: boolean
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  customInputActive: { character: boolean; setting: boolean; circumstance: boolean }
  setCustomInputActive: React.Dispatch<React.SetStateAction<{ character: boolean; setting: boolean; circumstance: boolean }>>
  availableCards: AvailableCards
  roomIsMature: boolean
  error: string
  onSubmitCards: () => void
  toast: { success: (m: string) => void }
}

export function JoinSelection({
  myRole, hasSubmitted, isSubmitting, selection, setSelection,
  customInputActive, setCustomInputActive, availableCards, roomIsMature, error,
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

  // Card picker
  return (
    <motion.div key="selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
            {customInputActive.character || customInputActive.setting || customInputActive.circumstance ? "✎ Writer's Room" : '🎴 Pick Your Cards'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[selection.character, selection.setting, selection.circumstance].map((value, index) => (
                <div key={index} className="w-3 h-3 rounded-full transition-all duration-300" style={{ background: value ? 'var(--color-success)' : 'var(--color-border)', transform: value ? 'scale(1)' : 'scale(0.8)' }} />
              ))}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3</span>
          </div>
        </div>

        {/* Shuffle button */}
        {!customInputActive.character && !customInputActive.setting && !customInputActive.circumstance && (
          <motion.button
            onClick={() => {
              if (availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
                setSelection({
                  character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
                  setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
                  circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
                })
                if ('vibrate' in navigator) navigator.vibrate([50, 50, 50])
                toast.success('Shuffled! 🎲')
              }
            }}
            className="btn btn-ghost w-full mb-6"
            style={{ background: 'linear-gradient(135deg, var(--color-highlight-pink), var(--color-highlight-yellow))', border: '2px solid var(--color-accent)', fontWeight: 'bold' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <span>🎲</span><span>Feeling Lucky? Shuffle All!</span>
          </motion.button>
        )}

        <div className="stack">
          <CardSlot label="Character" icon="🎭" type="characters" color="var(--color-accent)" value={selection.character} customActive={customInputActive.character}
            onToggleCustom={() => { setCustomInputActive(p => ({ ...p, character: !p.character })); if (!customInputActive.character) setSelection(s => ({ ...s, character: '' })) }}
            onChange={(v) => { setSelection(s => ({ ...s, character: v })); if ('vibrate' in navigator) navigator.vibrate(50) }}
            isMature={roomIsMature} />
          <CardSlot label="Setting" icon="🏛️" type="settings" color="var(--color-accent-2)" value={selection.setting} customActive={customInputActive.setting}
            onToggleCustom={() => { setCustomInputActive(p => ({ ...p, setting: !p.setting })); if (!customInputActive.setting) setSelection(s => ({ ...s, setting: '' })) }}
            onChange={(v) => { setSelection(s => ({ ...s, setting: v })); if ('vibrate' in navigator) navigator.vibrate(50) }}
            isMature={roomIsMature} />
          <CardSlot label="Circumstance" icon="⚡" type="circumstances" color="var(--color-warning)" value={selection.circumstance} customActive={customInputActive.circumstance}
            onToggleCustom={() => { setCustomInputActive(p => ({ ...p, circumstance: !p.circumstance })); if (!customInputActive.circumstance) setSelection(s => ({ ...s, circumstance: '' })) }}
            onChange={(v) => { setSelection(s => ({ ...s, circumstance: v })); if ('vibrate' in navigator) navigator.vibrate(50) }}
            isMature={roomIsMature} maxLength={80} />

          {error && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-danger)', border: '2px solid var(--color-bg)' }}>
              <p className="text-white text-center font-semibold">⚠️ {error}</p>
            </div>
          )}

          {(selection.character || selection.setting || selection.circumstance) && (
            <motion.div className="p-4 rounded-lg" style={{ background: 'var(--color-highlight)', border: '2px solid var(--color-accent)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.gentle}>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SELECTION:</p>
              <div className="text-sm space-y-1">
                {selection.character && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🎭 Character:</span> {selection.character}</p>}
                {selection.setting && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🏛️ Setting:</span> {selection.setting}</p>}
                {selection.circumstance && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">⚡ Circumstance:</span> {selection.circumstance}</p>}
              </div>
            </motion.div>
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
      </div>
    </motion.div>
  )
}

function CardSlot({ label, icon, type, color, value, customActive, onToggleCustom, onChange, isMature, maxLength = 50 }: {
  label: string; icon: string; type: 'characters' | 'settings' | 'circumstances'; color: string
  value: string; customActive: boolean; onToggleCustom: () => void; onChange: (v: string) => void
  isMature: boolean; maxLength?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button onClick={onToggleCustom} className="btn btn-ghost px-3 py-1.5 text-xs"
          style={{ background: customActive ? color : 'var(--color-surface-alt)', color: customActive ? 'white' : 'var(--color-text-secondary)' }}>
          <span>{customActive ? '✎ Write Custom' : '🃏 Pick Card'}</span>
        </button>
      </div>
      {customActive ? (
        <>
          <label className="label flex items-center gap-2 mb-3">
            <span className="text-2xl">{icon}</span>
            <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
          </label>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter custom ${label.toLowerCase()}...`} maxLength={maxLength}
            className="input font-script text-lg" style={{ background: 'var(--color-surface-alt)', border: `2px solid ${color}`, fontStyle: 'italic' }} />
        </>
      ) : (
        <SmartCardSelector label={label} icon={icon} type={type} value={value} onChange={onChange} color={color} isMature={isMature} />
      )}
    </div>
  )
}
