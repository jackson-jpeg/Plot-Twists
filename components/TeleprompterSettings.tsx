'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TeleprompterSettings as TeleprompterSettingsType, TeleprompterVisibilityMode } from '@/lib/types'
import { TELEPROMPTER_PRESETS } from '@/lib/types'

interface TeleprompterSettingsProps {
  settings: TeleprompterSettingsType
  onPresetChange: (mode: Exclude<TeleprompterVisibilityMode, 'custom'>) => void
  onCustomChange: (pastLines: number | 'all', upcomingLines: number | 'all') => void
  onAutoScrollToggle: () => void
  disabled?: boolean
  compact?: boolean
}

const PRESET_INFO: Record<Exclude<TeleprompterVisibilityMode, 'custom'>, { label: string; description: string }> = {
  focused: { label: 'Focused', description: '1 past, 1 upcoming' },
  balanced: { label: 'Balanced', description: '2 past, 3 upcoming' },
  full: { label: 'Full', description: 'All lines visible' }
}

export function TeleprompterSettings({
  settings,
  onPresetChange,
  onCustomChange,
  onAutoScrollToggle,
  disabled = false,
  compact = false
}: TeleprompterSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getModeLabel = () => {
    if (settings.visibilityMode === 'custom') {
      const past = settings.pastLinesVisible === 'all' ? 'all' : settings.pastLinesVisible
      const upcoming = settings.upcomingLinesVisible === 'all' ? 'all' : settings.upcomingLinesVisible
      return `Custom (${past}/${upcoming})`
    }
    return PRESET_INFO[settings.visibilityMode].label
  }

  const handlePastLinesChange = (value: number) => {
    onCustomChange(value, settings.upcomingLinesVisible)
  }

  const handleUpcomingLinesChange = (value: number) => {
    onCustomChange(settings.pastLinesVisible, value)
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors"
          style={{
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text-secondary)',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <span>👁️</span>
          <span className="text-sm">{getModeLabel()}</span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-xs"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 z-20 min-w-64 w-80 max-w-[calc(100dvw-2rem)] rounded-xl shadow-xl overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <CompactSettingsContent
                settings={settings}
                onPresetChange={onPresetChange}
                onCustomChange={onCustomChange}
                onAutoScrollToggle={onAutoScrollToggle}
                disabled={disabled}
                onClose={() => setIsExpanded(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop to close */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface-alt)' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between text-left transition-colors"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">👁️</span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Teleprompter View
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {getModeLabel()}
              {settings.autoScroll ? ' • Auto-scroll on' : ''}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Preset buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  View Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PRESET_INFO) as Exclude<TeleprompterVisibilityMode, 'custom'>[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => onPresetChange(mode)}
                      disabled={disabled}
                      className="p-3 rounded-lg text-center transition-all"
                      style={{
                        background: settings.visibilityMode === mode
                          ? 'var(--color-accent)'
                          : 'var(--color-surface)',
                        color: settings.visibilityMode === mode
                          ? 'white'
                          : 'var(--color-text-primary)',
                        border: settings.visibilityMode === mode
                          ? '2px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        opacity: disabled ? 0.5 : 1
                      }}
                    >
                      <div className="font-semibold text-sm">{PRESET_INFO[mode].label}</div>
                      <div className="text-xs opacity-75">{PRESET_INFO[mode].description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom option */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (settings.visibilityMode !== 'custom') {
                      onCustomChange(
                        typeof settings.pastLinesVisible === 'number' ? settings.pastLinesVisible : 2,
                        typeof settings.upcomingLinesVisible === 'number' ? settings.upcomingLinesVisible : 3
                      )
                    }
                  }}
                  disabled={disabled}
                  className="w-full p-3 rounded-lg text-left transition-all"
                  style={{
                    background: settings.visibilityMode === 'custom'
                      ? 'var(--color-accent)'
                      : 'var(--color-surface)',
                    color: settings.visibilityMode === 'custom'
                      ? 'white'
                      : 'var(--color-text-primary)',
                    border: settings.visibilityMode === 'custom'
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    opacity: disabled ? 0.5 : 1
                  }}
                >
                  <div className="font-semibold text-sm">Custom</div>
                  <div className="text-xs opacity-75">Set your own line counts</div>
                </button>

                {/* Custom sliders */}
                <AnimatePresence>
                  {settings.visibilityMode === 'custom' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 pl-4 overflow-hidden"
                      style={{ borderLeft: '2px solid var(--color-border)' }}
                    >
                      {/* Past lines slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Past Lines
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {settings.pastLinesVisible === 'all' ? 'All' : settings.pastLinesVisible}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={settings.pastLinesVisible === 'all' ? 5 : settings.pastLinesVisible}
                          onChange={(e) => handlePastLinesChange(parseInt(e.target.value))}
                          disabled={disabled}
                          className="w-full accent-[var(--color-accent)]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          <span>0</span>
                          <span>5</span>
                        </div>
                      </div>

                      {/* Upcoming lines slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Upcoming Lines
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {settings.upcomingLinesVisible === 'all' ? 'All' : settings.upcomingLinesVisible}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.upcomingLinesVisible === 'all' ? 10 : settings.upcomingLinesVisible}
                          onChange={(e) => handleUpcomingLinesChange(parseInt(e.target.value))}
                          disabled={disabled}
                          className="w-full accent-[var(--color-accent)]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          <span>1</span>
                          <span>10</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auto-scroll toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Auto-scroll
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Keep current line centered
                  </p>
                </div>
                <button
                  onClick={onAutoScrollToggle}
                  disabled={disabled}
                  className="w-12 h-6 rounded-full transition-colors"
                  style={{
                    background: settings.autoScroll ? 'var(--color-accent)' : 'var(--color-border)',
                    opacity: disabled ? 0.5 : 1
                  }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: settings.autoScroll ? 26 : 2 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact dropdown content
function CompactSettingsContent({
  settings,
  onPresetChange,
  onCustomChange,
  onAutoScrollToggle,
  disabled,
  onClose
}: TeleprompterSettingsProps & { onClose: () => void }) {
  return (
    <div className="p-3 space-y-3">
      {/* Preset buttons */}
      <div className="space-y-1">
        {(Object.keys(PRESET_INFO) as Exclude<TeleprompterVisibilityMode, 'custom'>[]).map(mode => (
          <button
            key={mode}
            onClick={() => {
              onPresetChange(mode)
              onClose()
            }}
            disabled={disabled}
            className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
            style={{
              background: settings.visibilityMode === mode
                ? 'var(--color-highlight)'
                : 'transparent',
              color: 'var(--color-text-primary)'
            }}
          >
            <span className="font-medium text-sm">{PRESET_INFO[mode].label}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {PRESET_INFO[mode].description}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Custom option with inline controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Custom
          </span>
          {settings.visibilityMode === 'custom' && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: 'white' }}>
              Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Past</label>
            <input
              type="number"
              min="0"
              max="5"
              value={settings.pastLinesVisible === 'all' ? 5 : settings.pastLinesVisible}
              onChange={(e) => onCustomChange(parseInt(e.target.value) || 0, settings.upcomingLinesVisible)}
              disabled={disabled}
              className="w-full p-1 rounded text-center text-base"
              style={{
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Upcoming</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.upcomingLinesVisible === 'all' ? 10 : settings.upcomingLinesVisible}
              onChange={(e) => onCustomChange(settings.pastLinesVisible, parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-full p-1 rounded text-center text-base"
              style={{
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Auto-scroll */}
      <button
        onClick={onAutoScrollToggle}
        disabled={disabled}
        className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="text-sm">Auto-scroll</span>
        <div
          className="w-10 h-5 rounded-full transition-colors relative"
          style={{ background: settings.autoScroll ? 'var(--color-accent)' : 'var(--color-border)' }}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
            animate={{ left: settings.autoScroll ? 22 : 2 }}
          />
        </div>
      </button>
    </div>
  )
}
