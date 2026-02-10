'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { ScriptCustomization, ComedyStyle, ScriptLength, ScriptDifficulty, PhysicalComedyLevel } from '@/lib/types'

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

const DEFAULT_CUSTOMIZATION: ScriptCustomization = {
  comedyStyle: 'witty',
  scriptLength: 'standard',
  difficulty: 'intermediate',
  physicalComedy: 'minimal',
  enableCallbacks: true
}

export function ScriptCustomizationPanel({
  customization = DEFAULT_CUSTOMIZATION,
  onChange,
  disabled = false
}: ScriptCustomizationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [local, setLocal] = useState<ScriptCustomization>(customization)
  const [hoveredStyle, setHoveredStyle] = useState<ComedyStyle | null>(null)
  const [hoveredLength, setHoveredLength] = useState<ScriptLength | null>(null)
  const [hoveredDifficulty, setHoveredDifficulty] = useState<ScriptDifficulty | null>(null)
  const [hoveredPhysical, setHoveredPhysical] = useState<PhysicalComedyLevel | null>(null)

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
    <div className="settings-panel">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="settings-panel-header disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Script Customization</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {COMEDY_STYLES.find(s => s.value === local.comedyStyle)?.label} •{' '}
              {SCRIPT_LENGTHS.find(l => l.value === local.scriptLength)?.label} •{' '}
              {DIFFICULTIES.find(d => d.value === local.difficulty)?.label}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ color: 'var(--color-text-secondary)' }}
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
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Comedy Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COMEDY_STYLES.map(style => {
                const isSelected = local.comedyStyle === style.value
                const isHovered = hoveredStyle === style.value
                return (
                  <button
                    key={style.value}
                    onClick={() => handleChange('comedyStyle', style.value)}
                    onMouseEnter={() => setHoveredStyle(style.value)}
                    onMouseLeave={() => setHoveredStyle(null)}
                    disabled={disabled}
                    className="p-3 rounded-lg text-center transition-all disabled:opacity-50"
                    style={{
                      background: isSelected
                        ? 'var(--color-accent)'
                        : isHovered
                          ? 'var(--color-surface-alt)'
                          : 'var(--color-surface-elevated)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                    }}
                  >
                    <div className="text-3xl mb-1">{style.emoji}</div>
                    <div className="text-sm font-medium font-display">{style.label}</div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              {COMEDY_STYLES.find(s => s.value === local.comedyStyle)?.description}
            </p>
          </div>

          <div className="divider-accent" />

          {/* Script Length */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Script Length
            </label>
            <div className="flex gap-2">
              {SCRIPT_LENGTHS.map(length => {
                const isSelected = local.scriptLength === length.value
                const isHovered = hoveredLength === length.value
                return (
                  <button
                    key={length.value}
                    onClick={() => handleChange('scriptLength', length.value)}
                    onMouseEnter={() => setHoveredLength(length.value)}
                    onMouseLeave={() => setHoveredLength(null)}
                    disabled={disabled}
                    className="flex-1 p-3 rounded-lg text-center transition-all disabled:opacity-50"
                    style={{
                      background: isSelected
                        ? 'var(--color-accent)'
                        : isHovered
                          ? 'var(--color-surface-alt)'
                          : 'var(--color-surface-elevated)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <div className="font-medium">{length.label}</div>
                    <div className="text-xs" style={{ opacity: 0.7 }}>{length.lines}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="divider-accent" />

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(diff => {
                const isSelected = local.difficulty === diff.value
                const isHovered = hoveredDifficulty === diff.value
                return (
                  <button
                    key={diff.value}
                    onClick={() => handleChange('difficulty', diff.value)}
                    onMouseEnter={() => setHoveredDifficulty(diff.value)}
                    onMouseLeave={() => setHoveredDifficulty(null)}
                    disabled={disabled}
                    className="flex-1 p-3 rounded-lg text-center transition-all disabled:opacity-50"
                    style={{
                      background: isSelected
                        ? 'var(--color-accent)'
                        : isHovered
                          ? 'var(--color-surface-alt)'
                          : 'var(--color-surface-elevated)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <div className="font-medium">{diff.label}</div>
                    <div className="text-xs" style={{ opacity: 0.7 }}>{diff.description}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="divider-accent" />

          {/* Physical Comedy */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Physical Comedy Level
            </label>
            <div className="flex gap-2">
              {PHYSICAL_LEVELS.map(level => {
                const isSelected = local.physicalComedy === level.value
                const isHovered = hoveredPhysical === level.value
                return (
                  <button
                    key={level.value}
                    onClick={() => handleChange('physicalComedy', level.value)}
                    onMouseEnter={() => setHoveredPhysical(level.value)}
                    onMouseLeave={() => setHoveredPhysical(null)}
                    disabled={disabled}
                    className="flex-1 p-2 rounded-lg text-center transition-all disabled:opacity-50"
                    style={{
                      background: isSelected
                        ? 'var(--color-accent)'
                        : isHovered
                          ? 'var(--color-surface-alt)'
                          : 'var(--color-surface-elevated)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {level.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="divider-accent" />

          {/* Enable Callbacks Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Enable Callbacks</span>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Reference jokes from previous rounds</p>
            </div>
            <button
              onClick={() => handleChange('enableCallbacks', !local.enableCallbacks)}
              disabled={disabled}
              className="toggle-switch disabled:opacity-50"
              data-on={local.enableCallbacks ? 'true' : 'false'}
            >
              <motion.div
                animate={{ x: local.enableCallbacks ? 24 : 2 }}
                className="toggle-switch-knob"
              />
            </button>
          </div>

          <div className="divider-accent" />

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Custom Instructions (Optional)
            </label>
            <textarea
              value={local.customInstructions || ''}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              disabled={disabled}
              placeholder="E.g., 'Include a running gag about coffee' or 'Make the villain sympathetic'"
              maxLength={500}
              className="w-full p-3 rounded-lg resize-none h-20 disabled:opacity-50"
              style={{
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                '--tw-placeholder-opacity': 1,
              } as React.CSSProperties}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {(local.customInstructions?.length || 0)}/500 characters
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
