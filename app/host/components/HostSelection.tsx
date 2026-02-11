'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player, RoomSettings, CardSelection, AvailableCards } from '@/lib/types'
import { SmartCardSelector } from '@/components/SmartCardSelector'
import { VARIANTS } from '@/lib/animations'

export interface HostSelectionProps {
  settings: RoomSettings
  players: Player[]
  selection: CardSelection
  setSelection: React.Dispatch<React.SetStateAction<CardSelection>>
  customInputActive: { character: boolean; setting: boolean; circumstance: boolean }
  setCustomInputActive: React.Dispatch<React.SetStateAction<{ character: boolean; setting: boolean; circumstance: boolean }>>
  hasSubmittedSelection: boolean
  isSubmittingCards: boolean
  availableCards: AvailableCards
  onSubmitSoloCards: () => void
  onBackToLobby: () => void
  toast: { success: (m: string) => void }
}

export function HostSelection({
  settings, players, selection, setSelection,
  customInputActive, setCustomInputActive,
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
    return (
      <motion.div key="solo-selection" variants={pageTransitionVariants} initial="initial" animate="animate" exit="exit" className="container max-w-2xl">
        <motion.button onClick={onBackToLobby} className="back-button mb-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
          <span className="back-arrow">←</span><span>Back to Lobby</span>
        </motion.button>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>🎴 Pick Your Cards</h1>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[selection.character, selection.setting, selection.circumstance].map((value, index) => (
                  <div key={index} className="w-3 h-3 rounded-full transition-all duration-300" style={{ background: value ? 'var(--color-success)' : 'var(--color-border)', transform: value ? 'scale(1)' : 'scale(0.8)' }} />
                ))}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3</span>
            </div>
          </div>

          {availableCards.characters.length === 0 && (
            <motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="text-4xl mb-4" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🎴</motion.div>
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</p>
            </motion.div>
          )}

          {availableCards.characters.length > 0 && !customInputActive.character && !customInputActive.setting && !customInputActive.circumstance && (
            <motion.button
              onClick={() => {
                if (availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
                  setSelection({
                    character: availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)],
                    setting: availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)],
                    circumstance: availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
                  })
                  toast.success('Shuffled! 🎲')
                }
              }}
              className="btn btn-ghost w-full mb-4"
              style={{ background: 'linear-gradient(135deg, var(--color-highlight-pink), var(--color-highlight-yellow))', border: '2px solid var(--color-accent)', fontWeight: 'bold' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              <span>🎲</span><span>Feeling Lucky? Shuffle All!</span>
            </motion.button>
          )}

          {availableCards.characters.length > 0 && (
            <div className="stack">
              {/* Character */}
              <CardSlot label="Character" icon="🎭" type="characters" color="var(--color-accent)"
                value={selection.character} customActive={customInputActive.character}
                onToggleCustom={() => { setCustomInputActive(p => ({ ...p, character: !p.character })); if (!customInputActive.character) setSelection(s => ({ ...s, character: '' })) }}
                onChange={(v) => setSelection(s => ({ ...s, character: v }))}
                isMature={settings.isMature}
              />
              {/* Setting */}
              <CardSlot label="Setting" icon="🏛️" type="settings" color="var(--color-accent-2)"
                value={selection.setting} customActive={customInputActive.setting}
                onToggleCustom={() => { setCustomInputActive(p => ({ ...p, setting: !p.setting })); if (!customInputActive.setting) setSelection(s => ({ ...s, setting: '' })) }}
                onChange={(v) => setSelection(s => ({ ...s, setting: v }))}
                isMature={settings.isMature}
              />
              {/* Circumstance */}
              <CardSlot label="Circumstance" icon="⚡" type="circumstances" color="var(--color-warning)"
                value={selection.circumstance} customActive={customInputActive.circumstance}
                onToggleCustom={() => { setCustomInputActive(p => ({ ...p, circumstance: !p.circumstance })); if (!customInputActive.circumstance) setSelection(s => ({ ...s, circumstance: '' })) }}
                onChange={(v) => setSelection(s => ({ ...s, circumstance: v }))}
                isMature={settings.isMature} maxLength={80}
              />

              {/* Selection Preview */}
              {(selection.character || selection.setting || selection.circumstance) && (
                <motion.div className="p-4 rounded-lg" style={{ background: 'var(--color-highlight)', border: '2px solid var(--color-accent)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SELECTION:</p>
                  <div className="text-sm space-y-1">
                    {selection.character && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🎭 Character:</span> {selection.character}</p>}
                    {selection.setting && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">🏛️ Setting:</span> {selection.setting}</p>}
                    {selection.circumstance && <p style={{ color: 'var(--color-text-primary)' }}><span className="font-bold">⚡ Circumstance:</span> {selection.circumstance}</p>}
                  </div>
                </motion.div>
              )}

              <motion.button
                onClick={onSubmitSoloCards}
                disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards}
                className="btn btn-primary btn-large w-full mt-6"
                style={{ opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards) ? 0.6 : 1 }}
                whileHover={{ scale: isSubmittingCards ? 1 : 1.02 }} whileTap={{ scale: isSubmittingCards ? 1 : 0.98 }}
                animate={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? { boxShadow: ['0 0 0 0 rgba(245, 158, 66, 0)', '0 0 0 10px rgba(245, 158, 66, 0.3)', '0 0 0 0 rgba(245, 158, 66, 0)'] } : {}}
                transition={(selection.character && selection.setting && selection.circumstance && !isSubmittingCards) ? { duration: 2, repeat: Infinity } : {}}
              >
                {isSubmittingCards ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span><span>Submitting...</span></>
                ) : (
                  <><span>✨</span><span>{(!selection.character || !selection.setting || !selection.circumstance) ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)` : 'Submit Cards - Ready!'}</span></>
                )}
              </motion.button>
            </div>
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

// Internal helper component for card selection slots
function CardSlot({ label, icon, type, color, value, customActive, onToggleCustom, onChange, isMature, maxLength = 50 }: {
  label: string; icon: string; type: 'characters' | 'settings' | 'circumstances'; color: string
  value: string; customActive: boolean; onToggleCustom: () => void; onChange: (v: string) => void
  isMature: boolean; maxLength?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={onToggleCustom}
          className="btn btn-ghost px-3 py-1.5 text-xs"
          style={{ background: customActive ? color : 'var(--color-surface-alt)', color: customActive ? 'white' : 'var(--color-text-secondary)' }}
        >
          <span>{customActive ? '✎ Custom' : '🃏 Cards'}</span>
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
