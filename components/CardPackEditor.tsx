'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { CardPack, Card } from '@/lib/types'

interface CardPackEditorProps {
  isOpen: boolean
  packId: string
  onClose: () => void
  onUpdated?: () => void
}

const THEMES = [
  { value: 'mixed', label: 'Mixed', emoji: '🎭' },
  { value: 'office', label: 'Office', emoji: '💼' },
  { value: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
  { value: 'fantasy', label: 'Fantasy', emoji: '🧙' },
  { value: 'horror', label: 'Horror', emoji: '👻' },
  { value: 'romance', label: 'Romance', emoji: '💕' },
  { value: 'action', label: 'Action', emoji: '💥' },
  { value: 'comedy', label: 'Comedy', emoji: '😂' }
]

export function CardPackEditor({ isOpen, packId, onClose, onUpdated }: CardPackEditorProps) {
  const { socket } = useSocket()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pack metadata
  const [packName, setPackName] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packTheme, setPackTheme] = useState('mixed')
  const [authorName, setAuthorName] = useState('')
  const [isMature, setIsMature] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  // Cards
  const [characters, setCharacters] = useState<Card[]>([])
  const [settings, setSettings] = useState<Card[]>([])
  const [circumstances, setCircumstances] = useState<Card[]>([])

  // Load pack data
  useEffect(() => {
    if (!isOpen || !socket || !packId) return

    setIsLoading(true)
    socket.emit('get_card_pack', packId, (response) => {
      setIsLoading(false)
      if (response.success && response.pack) {
        const pack = response.pack
        setPackName(pack.name)
        setPackDescription(pack.description)
        setPackTheme(pack.theme)
        setAuthorName(pack.author)
        setIsMature(pack.isMature)
        setIsPublic(pack.isPublic)
        setCharacters(pack.characters)
        setSettings(pack.settings)
        setCircumstances(pack.circumstances)
      } else {
        setError(response.error || 'Failed to load pack')
      }
    })
  }, [isOpen, socket, packId])

  const addCard = (type: 'characters' | 'settings' | 'circumstances') => {
    const newCard: Card = { id: `new-${Date.now()}`, name: '', description: '' }
    if (type === 'characters') setCharacters([...characters, newCard])
    else if (type === 'settings') setSettings([...settings, newCard])
    else setCircumstances([...circumstances, newCard])
  }

  const removeCard = (type: 'characters' | 'settings' | 'circumstances', index: number) => {
    if (type === 'characters' && characters.length > 5) {
      setCharacters(characters.filter((_, i) => i !== index))
    } else if (type === 'settings' && settings.length > 3) {
      setSettings(settings.filter((_, i) => i !== index))
    } else if (type === 'circumstances' && circumstances.length > 3) {
      setCircumstances(circumstances.filter((_, i) => i !== index))
    }
  }

  const updateCard = (
    type: 'characters' | 'settings' | 'circumstances',
    index: number,
    field: 'name' | 'description',
    value: string
  ) => {
    if (type === 'characters') {
      const updated = [...characters]
      updated[index] = { ...updated[index], [field]: value }
      setCharacters(updated)
    } else if (type === 'settings') {
      const updated = [...settings]
      updated[index] = { ...updated[index], [field]: value }
      setSettings(updated)
    } else {
      const updated = [...circumstances]
      updated[index] = { ...updated[index], [field]: value }
      setCircumstances(updated)
    }
  }

  const validateStep1 = () => {
    if (packName.trim().length < 3) {
      setError('Pack name must be at least 3 characters')
      return false
    }
    if (!authorName.trim()) {
      setError('Please enter your name as the author')
      return false
    }
    setError(null)
    return true
  }

  const validateStep2 = () => {
    const validCharacters = characters.filter(c => c.name.trim())
    if (validCharacters.length < 5) {
      setError('Please add at least 5 characters')
      return false
    }
    setError(null)
    return true
  }

  const validateStep3 = () => {
    const validSettings = settings.filter(s => s.name.trim())
    const validCircumstances = circumstances.filter(c => c.name.trim())
    if (validSettings.length < 3) {
      setError('Please add at least 3 settings')
      return false
    }
    if (validCircumstances.length < 3) {
      setError('Please add at least 3 circumstances')
      return false
    }
    setError(null)
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) handleSubmit()
  }

  const handleSubmit = useCallback(() => {
    if (!socket) return

    setIsSubmitting(true)
    setError(null)

    const updates = {
      name: packName.trim(),
      description: packDescription.trim(),
      author: authorName.trim(),
      theme: packTheme,
      isMature,
      isPublic,
      characters: characters.filter(c => c.name.trim()).map(c => ({
        id: c.id,
        name: c.name.trim(),
        description: c.description?.trim() || ''
      })),
      settings: settings.filter(s => s.name.trim()).map(s => ({
        id: s.id,
        name: s.name.trim(),
        description: s.description?.trim() || ''
      })),
      circumstances: circumstances.filter(c => c.name.trim()).map(c => ({
        id: c.id,
        name: c.name.trim(),
        description: c.description?.trim() || ''
      }))
    }

    socket.emit('update_card_pack', packId, updates, (response) => {
      setIsSubmitting(false)
      if (response.success) {
        onUpdated?.()
        onClose()
      } else {
        setError(response.error || 'Failed to update pack')
      }
    })
  }, [socket, packId, packName, packDescription, authorName, packTheme, isMature, isPublic, characters, settings, circumstances, onUpdated, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="rounded-2xl w-full max-w-2xl max-h-[90dvh] overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-3)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Edit Card Pack</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-lg" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}
              >
                x
              </button>
            </div>
            {/* Progress indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className="flex-1 h-2 rounded-full transition-colors"
                  style={{ background: s <= step ? 'var(--color-accent)' : 'var(--color-border)' }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>Details</span>
              <span>Characters</span>
              <span>Settings & Circumstances</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Loading pack data...
              </div>
            ) : (
              <>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 px-4 py-3 rounded-lg text-sm"
                    style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Step 1: Pack Details */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Pack Name *
                      </label>
                      <input
                        type="text"
                        value={packName}
                        onChange={(e) => setPackName(e.target.value)}
                        placeholder="e.g., Superhero Showdown"
                        maxLength={50}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Description
                      </label>
                      <textarea
                        value={packDescription}
                        onChange={(e) => setPackDescription(e.target.value)}
                        placeholder="What makes this pack special?"
                        maxLength={200}
                        className="w-full px-3 py-2 rounded-lg text-sm resize-none h-20" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Author Name *
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Pack Author"
                        maxLength={30}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Theme
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {THEMES.map(theme => (
                          <button
                            key={theme.value}
                            onClick={() => setPackTheme(theme.value)}
                            className="p-2 rounded-lg text-center transition-all"
                            style={packTheme === theme.value
                              ? { background: 'var(--color-accent)', color: 'white', border: '1px solid var(--color-accent)' }
                              : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                            }
                          >
                            <div className="text-xl">{theme.emoji}</div>
                            <div className="text-xs">{theme.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMature}
                          onChange={(e) => setIsMature(e.target.checked)}
                          className="w-4 h-4"
                          style={{ accentColor: 'var(--color-purple)' }}
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">Contains mature content (18+)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="w-4 h-4"
                          style={{ accentColor: 'var(--color-purple)' }}
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">Make public</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Characters */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Add at least 5 characters. These will be randomly assigned to players.
                    </p>

                    {characters.map((char, index) => (
                      <div key={char.id || index} className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={char.name}
                            onChange={(e) => updateCard('characters', index, 'name', e.target.value)}
                            placeholder={`Character ${index + 1} name`}
                            maxLength={50}
                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={char.description || ''}
                          onChange={(e) => updateCard('characters', index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          maxLength={100}
                          className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                        />
                        {characters.length > 5 && (
                          <button
                            onClick={() => removeCard('characters', index)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                          >
                            x
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addCard('characters')}
                      className="w-full py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-accent)', border: '1px dashed var(--color-border)', cursor: 'pointer' }}
                    >
                      + Add Character
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Settings & Circumstances */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Settings (min 3)</h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Where will the scenes take place?
                      </p>

                      {settings.map((setting, index) => (
                        <div key={setting.id || index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={setting.name}
                            onChange={(e) => updateCard('settings', index, 'name', e.target.value)}
                            placeholder={`Setting ${index + 1}`}
                            maxLength={50}
                            className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                          />
                          {settings.length > 3 && (
                            <button
                              onClick={() => removeCard('settings', index)}
                              className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                            >
                              x
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => addCard('settings')}
                        className="text-sm px-2 py-1 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-accent)', border: '1px dashed var(--color-border)', cursor: 'pointer' }}
                      >
                        + Add Setting
                      </button>
                    </div>

                    {/* Circumstances */}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Circumstances (min 3)</h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        What situations will the characters face?
                      </p>

                      {circumstances.map((circ, index) => (
                        <div key={circ.id || index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={circ.name}
                            onChange={(e) => updateCard('circumstances', index, 'name', e.target.value)}
                            placeholder={`Circumstance ${index + 1}`}
                            maxLength={80}
                            className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                          />
                          {circumstances.length > 3 && (
                            <button
                              onClick={() => removeCard('circumstances', index)}
                              className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                            >
                              x
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => addCard('circumstances')}
                        className="text-sm px-2 py-1 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-accent)', border: '1px dashed var(--color-border)', cursor: 'pointer' }}
                      >
                        + Add Circumstance
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--color-border)] flex justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              {isSubmitting ? 'Saving...' : step === 3 ? 'Save Changes' : 'Next'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
