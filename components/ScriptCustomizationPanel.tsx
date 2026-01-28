'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { ScriptCustomization, ComedyStyle, ScriptLength, ScriptDifficulty, PhysicalComedyLevel, GenrePack } from '@/lib/types'
import { GENRE_PACK_INFO } from '@/lib/types'

interface ScriptCustomizationPanelProps {
  customization?: ScriptCustomization
  onChange: (customization: ScriptCustomization) => void
  disabled?: boolean
}

const COMEDY_STYLES: { value: ComedyStyle; label: string; emoji: string; description: string }[] = [
  { value: 'witty', label: 'Witty', emoji: '🎩', description: 'Sharp wordplay and clever retorts' },
  { value: 'slapstick', label: 'Slapstick', emoji: '🤪', description: 'Physical comedy and pratfalls' },
  { value: 'absurdist', label: 'Absurdist', emoji: '🌀', description: 'Surreal and nonsensical humor' },
  { value: 'dark', label: 'Dark', emoji: '🖤', description: 'Gallows humor and morbid jokes' },
  { value: 'sitcom', label: 'Sitcom', emoji: '📺', description: 'Classic TV-style misunderstandings' },
  { value: 'improv', label: 'Improv', emoji: '🎭', description: 'Yes-and energy and discovery' }
]

const SCRIPT_LENGTHS: { value: ScriptLength; label: string; lines: string }[] = [
  { value: 'quick', label: 'Quick', lines: '15-25 lines' },
  { value: 'standard', label: 'Standard', lines: '30-40 lines' },
  { value: 'epic', label: 'Epic', lines: '45-60 lines' }
]

const DIFFICULTIES: { value: ScriptDifficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Short lines, clear cues' },
  { value: 'intermediate', label: 'Intermediate', description: 'Balanced challenge' },
  { value: 'advanced', label: 'Advanced', description: 'Complex timing required' }
]

const PHYSICAL_LEVELS: { value: PhysicalComedyLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'heavy', label: 'Heavy' }
]

const GENRE_PACKS: { value: GenrePack; label: string; icon: string; description: string }[] = Object.entries(GENRE_PACK_INFO).map(([key, info]) => ({
  value: key as GenrePack,
  label: info.name,
  icon: info.icon,
  description: info.description
}))

const DEFAULT_CUSTOMIZATION: ScriptCustomization = {
  comedyStyle: 'witty',
  scriptLength: 'standard',
  difficulty: 'intermediate',
  physicalComedy: 'minimal',
  enableCallbacks: true,
  genrePack: 'classic_comedy'
}

export function ScriptCustomizationPanel({
  customization = DEFAULT_CUSTOMIZATION,
  onChange,
  disabled = false
}: ScriptCustomizationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [local, setLocal] = useState<ScriptCustomization>(customization)

  useEffect(() => {
    setLocal(customization)
  }, [customization])

  const handleChange = <K extends keyof ScriptCustomization>(
    key: K,
    value: ScriptCustomization[K]
  ) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    onChange(updated)
  }

  return (
    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h3 className="font-semibold text-white">Script Customization</h3>
            <p className="text-sm text-gray-400">
              {GENRE_PACKS.find(g => g.value === local.genrePack)?.icon}{' '}
              {GENRE_PACKS.find(g => g.value === local.genrePack)?.label} •{' '}
              {COMEDY_STYLES.find(s => s.value === local.comedyStyle)?.label} •{' '}
              {SCRIPT_LENGTHS.find(l => l.value === local.scriptLength)?.label}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0 space-y-6">
          {/* Comedy Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comedy Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COMEDY_STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => handleChange('comedyStyle', style.value)}
                  disabled={disabled}
                  className={`p-3 rounded-lg text-center transition-all ${
                    local.comedyStyle === style.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="text-sm font-medium">{style.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {COMEDY_STYLES.find(s => s.value === local.comedyStyle)?.description}
            </p>
          </div>

          {/* Genre Pack */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genre Style
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {GENRE_PACKS.map(genre => (
                <button
                  key={genre.value}
                  onClick={() => handleChange('genrePack', genre.value)}
                  disabled={disabled}
                  className={`p-3 rounded-lg text-left transition-all ${
                    local.genrePack === genre.value
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{genre.icon}</span>
                    <span className="text-sm font-medium">{genre.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {GENRE_PACKS.find(g => g.value === local.genrePack)?.description}
            </p>
          </div>

          {/* Script Length */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Script Length
            </label>
            <div className="flex gap-2">
              {SCRIPT_LENGTHS.map(length => (
                <button
                  key={length.value}
                  onClick={() => handleChange('scriptLength', length.value)}
                  disabled={disabled}
                  className={`flex-1 p-3 rounded-lg text-center transition-all ${
                    local.scriptLength === length.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">{length.label}</div>
                  <div className="text-xs opacity-70">{length.lines}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(diff => (
                <button
                  key={diff.value}
                  onClick={() => handleChange('difficulty', diff.value)}
                  disabled={disabled}
                  className={`flex-1 p-3 rounded-lg text-center transition-all ${
                    local.difficulty === diff.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium">{diff.label}</div>
                  <div className="text-xs opacity-70">{diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Physical Comedy */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Physical Comedy Level
            </label>
            <div className="flex gap-2">
              {PHYSICAL_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleChange('physicalComedy', level.value)}
                  disabled={disabled}
                  className={`flex-1 p-2 rounded-lg text-center transition-all ${
                    local.physicalComedy === level.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enable Callbacks Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-300">Enable Callbacks</span>
              <p className="text-xs text-gray-500">Reference jokes from previous rounds</p>
            </div>
            <button
              onClick={() => handleChange('enableCallbacks', !local.enableCallbacks)}
              disabled={disabled}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                local.enableCallbacks ? 'bg-purple-600' : 'bg-gray-700'
              } disabled:opacity-50`}
            >
              <motion.div
                animate={{ x: local.enableCallbacks ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={local.customInstructions || ''}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              disabled={disabled}
              placeholder="E.g., 'Include a running gag about coffee' or 'Make the villain sympathetic'"
              maxLength={500}
              className="w-full p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 resize-none h-20 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(local.customInstructions?.length || 0)}/500 characters
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
