'use client'

import { useState, useCallback } from 'react'
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

  // Cards
  const [characters, setCharacters] = useState<Card[]>([
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' }
  ])
  const [settings, setSettings] = useState<Card[]>([
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' }
  ])
  const [circumstances, setCircumstances] = useState<Card[]>([
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' }
  ])

  const addCard = (type: 'characters' | 'settings' | 'circumstances') => {
    const newCard = { name: '', description: '' }
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
          className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create Card Pack</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            {/* Progress indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    s <= step ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
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
                className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pack Name *
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="e.g., Superhero Showdown"
                    maxLength={50}
                    className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={packDescription}
                    onChange={(e) => setPackDescription(e.target.value)}
                    placeholder="What makes this pack special?"
                    maxLength={200}
                    className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 resize-none h-20 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Pack Author"
                    maxLength={30}
                    className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => setPackTheme(theme.value)}
                        className={`p-2 rounded-lg text-center transition-all ${
                          packTheme === theme.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-sm text-gray-300">Contains mature content (18+)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-sm text-gray-300">Make public</span>
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
                <p className="text-gray-400 text-sm">
                  Add at least 5 characters. These will be randomly assigned to players.
                </p>

                {characters.map((char, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => updateCard('characters', index, 'name', e.target.value)}
                        placeholder={`Character ${index + 1} name`}
                        maxLength={50}
                        className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={char.description || ''}
                      onChange={(e) => updateCard('characters', index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      maxLength={100}
                      className="flex-1 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    {characters.length > 5 && (
                      <button
                        onClick={() => removeCard('characters', index)}
                        className="px-3 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addCard('characters')}
                  className="w-full p-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
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
                  <h3 className="text-lg font-semibold text-white mb-2">Settings (min 3)</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Where will the scenes take place?
                  </p>

                  {settings.map((setting, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={setting.name}
                        onChange={(e) => updateCard('settings', index, 'name', e.target.value)}
                        placeholder={`Setting ${index + 1}`}
                        maxLength={50}
                        className="flex-1 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      {settings.length > 3 && (
                        <button
                          onClick={() => removeCard('settings', index)}
                          className="px-3 text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addCard('settings')}
                    className="w-full p-2 border border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors text-sm"
                  >
                    + Add Setting
                  </button>
                </div>

                {/* Circumstances */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Circumstances (min 3)</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    What situations will the characters face?
                  </p>

                  {circumstances.map((circ, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={circ.name}
                        onChange={(e) => updateCard('circumstances', index, 'name', e.target.value)}
                        placeholder={`Circumstance ${index + 1}`}
                        maxLength={80}
                        className="flex-1 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      {circumstances.length > 3 && (
                        <button
                          onClick={() => removeCard('circumstances', index)}
                          className="px-3 text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addCard('circumstances')}
                    className="w-full p-2 border border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors text-sm"
                  >
                    + Add Circumstance
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : step === 3 ? 'Create Pack' : 'Next'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
