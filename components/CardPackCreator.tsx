'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'

interface Card {
  id?: string
  name: string
  description?: string
}

interface CardPackCreatorProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (packId: string) => void
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

export function CardPackCreator({ isOpen, onClose, onCreated }: CardPackCreatorProps) {
  const { socket } = useSocket()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pack metadata
  const [packName, setPackName] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packTheme, setPackTheme] = useState('mixed')
  const [authorName, setAuthorName] = useState('')
  const [isMature, setIsMature] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  // Card key counter for stable React keys
  const cardKeyRef = useRef(20)
  const nextKey = () => String(cardKeyRef.current++)

  // Cards
  const [characters, setCharacters] = useState<Card[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' },
    { id: '4', name: '', description: '' },
    { id: '5', name: '', description: '' }
  ])
  const [settings, setSettings] = useState<Card[]>([
    { id: '6', name: '', description: '' },
    { id: '7', name: '', description: '' },
    { id: '8', name: '', description: '' }
  ])
  const [circumstances, setCircumstances] = useState<Card[]>([
    { id: '9', name: '', description: '' },
    { id: '10', name: '', description: '' },
    { id: '11', name: '', description: '' }
  ])

  const addCard = (type: 'characters' | 'settings' | 'circumstances') => {
    const newCard = { id: nextKey(), name: '', description: '' }
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

    const packData = {
      name: packName.trim(),
      description: packDescription.trim() || `A custom card pack by ${authorName}`,
      author: authorName.trim(),
      theme: packTheme,
      isMature,
      isBuiltIn: false, // Custom packs are never built-in
      isPublic,
      characters: characters.filter(c => c.name.trim()).map(c => ({
        name: c.name.trim(),
        description: c.description?.trim() || ''
      })),
      settings: settings.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(),
        description: s.description?.trim() || ''
      })),
      circumstances: circumstances.filter(c => c.name.trim()).map(c => ({
        name: c.name.trim(),
        description: c.description?.trim() || ''
      }))
    }

    socket.emit('create_card_pack', packData, (response) => {
      setIsSubmitting(false)
      if (response.success && response.packId) {
        onCreated?.(response.packId)
        onClose()
        resetForm()
      } else {
        setError(response.error || 'Failed to create pack')
      }
    })
  }, [socket, packName, packDescription, authorName, packTheme, isMature, isPublic, characters, settings, circumstances, onCreated, onClose])

  const resetForm = () => {
    setStep(1)
    setPackName('')
    setPackDescription('')
    setPackTheme('mixed')
    setAuthorName('')
    setIsMature(false)
    setIsPublic(true)
    setCharacters([
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ])
    setSettings([
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ])
    setCircumstances([
      { name: '', description: '' },
      { name: '', description: '' },
      { name: '', description: '' }
    ])
    setError(null)
  }

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
          className="modal-panel w-full max-w-2xl max-h-[90dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Create Card Pack</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-lg" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            {/* Progress indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`progress-step ${
                    s <= step ? 'progress-step-active' : 'progress-step-inactive'
                  }`}
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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-banner"
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
                  <label className="form-label">
                    Pack Name *
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="e.g., Superhero Showdown"
                    maxLength={50}
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Description
                  </label>
                  <textarea
                    value={packDescription}
                    onChange={(e) => setPackDescription(e.target.value)}
                    placeholder="What makes this pack special?"
                    maxLength={200}
                    className="form-input w-full resize-none h-20"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Pack Author"
                    maxLength={30}
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Theme
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setPackTheme(theme.value)}
                        className={`p-2 rounded-lg text-center transition-all ${
                          packTheme === theme.value
                            ? 'pill-active'
                            : 'pill-inactive'
                        }`}
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
                  <div key={char.id} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => updateCard('characters', index, 'name', e.target.value)}
                        placeholder={`Character ${index + 1} name`}
                        maxLength={50}
                        className="form-input w-full"
                      />
                    </div>
                    <input
                      type="text"
                      value={char.description || ''}
                      onChange={(e) => updateCard('characters', index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      maxLength={100}
                      className="form-input flex-1"
                    />
                    {characters.length > 5 && (
                      <button
                        onClick={() => removeCard('characters', index)}
                        className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                      >
                        ×
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
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Settings (min 3)</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Where will the scenes take place?
                  </p>

                  {settings.map((setting, index) => (
                    <div key={setting.id} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={setting.name}
                        onChange={(e) => updateCard('settings', index, 'name', e.target.value)}
                        placeholder={`Setting ${index + 1}`}
                        maxLength={50}
                        className="form-input flex-1"
                      />
                      {settings.length > 3 && (
                        <button
                          onClick={() => removeCard('settings', index)}
                          className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                        >
                          ×
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
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Circumstances (min 3)</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    What situations will the characters face?
                  </p>

                  {circumstances.map((circ, index) => (
                    <div key={circ.id} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={circ.name}
                        onChange={(e) => updateCard('circumstances', index, 'name', e.target.value)}
                        placeholder={`Circumstance ${index + 1}`}
                        maxLength={80}
                        className="form-input flex-1"
                      />
                      {circumstances.length > 3 && (
                        <button
                          onClick={() => removeCard('circumstances', index)}
                          className="w-6 h-6 flex items-center justify-center rounded text-xs" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                        >
                          ×
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
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-between" style={{ borderColor: 'var(--color-border)' }}>
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {isSubmitting ? 'Creating...' : step === 3 ? 'Create Pack' : 'Next'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
