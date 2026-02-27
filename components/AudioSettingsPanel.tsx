'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { AudioSettings, SoundEffectType } from '@/lib/types'
import { logger } from '@/lib/logger'

interface AudioSettingsPanelProps {
  settings?: AudioSettings
  onChange: (settings: AudioSettings) => void
  disabled?: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  voiceEnabled: false,
  voiceSettings: {
    enabled: false,
    provider: 'browser',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8
  },
  soundEffectsEnabled: true,
  soundEffectsVolume: 0.5,
  ambienceEnabled: false,
  ambienceVolume: 0.3,
  turnChimeEnabled: true
}

const SOUND_EFFECTS: { type: SoundEffectType; emoji: string; label: string }[] = [
  { type: 'laugh_track', emoji: '😂', label: 'Laugh Track' },
  { type: 'applause', emoji: '👏', label: 'Applause' },
  { type: 'dramatic_sting', emoji: '🎵', label: 'Dramatic' },
  { type: 'record_scratch', emoji: '💿', label: 'Record Scratch' },
  { type: 'door_slam', emoji: '🚪', label: 'Door Slam' },
  { type: 'crickets', emoji: '🦗', label: 'Crickets' }
]

export function AudioSettingsPanel({
  settings = DEFAULT_SETTINGS,
  onChange,
  disabled = false
}: AudioSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [local, setLocal] = useState<AudioSettings>(settings)
  const [testingSound, setTestingSound] = useState<SoundEffectType | null>(null)
  const [hoveredEffect, setHoveredEffect] = useState<SoundEffectType | null>(null)
  const [hoveredTestVoice, setHoveredTestVoice] = useState(false)

  useEffect(() => {
    setLocal(settings)
  }, [settings])

  const handleChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    onChange(updated)
  }

  const testSoundEffect = async (effect: SoundEffectType) => {
    if (testingSound) return

    setTestingSound(effect)

    // Play a test sound using browser audio
    try {
      const audio = new Audio(`/sounds/${effect.replace('_', '-')}.mp3`)
      audio.volume = local.soundEffectsVolume
      await audio.play()
    } catch (e) {
      logger.debug('Sound test not available in preview')
    }

    setTimeout(() => setTestingSound(null), 1000)
  }

  const testVoice = () => {
    if (!('speechSynthesis' in window)) return

    const utterance = new SpeechSynthesisUtterance('Hello! This is a voice test.')
    utterance.rate = local.voiceSettings.speed
    utterance.pitch = local.voiceSettings.pitch
    utterance.volume = local.voiceSettings.volume
    speechSynthesis.speak(utterance)
  }

  return (
    <div style={{ background: 'var(--color-surface-alt)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="disabled:opacity-50"
        style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔊</span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Audio Settings</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {local.soundEffectsEnabled ? 'SFX On' : 'SFX Off'}
              {' • '}
              {local.voiceEnabled ? 'Voice On' : 'Voice Off'}
              {' • '}
              {local.ambienceEnabled ? 'Ambience On' : 'Ambience Off'}
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
          {/* Sound Effects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Sound Effects</span>
              <button
                onClick={() => handleChange('soundEffectsEnabled', !local.soundEffectsEnabled)}
                disabled={disabled}
                className="disabled:opacity-50"
                role="switch"
                aria-checked={local.soundEffectsEnabled}
                aria-label="Sound effects"
                style={{ width: 48, height: 24, borderRadius: '9999px', position: 'relative', cursor: 'pointer', border: 'none', background: local.soundEffectsEnabled ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
              >
                <motion.div
                  animate={{ x: local.soundEffectsEnabled ? 24 : 2 }}
                  style={{ position: 'absolute', top: 2, width: 20, height: 20, background: 'white', borderRadius: '9999px' }}
                />
              </button>
            </div>

            {local.soundEffectsEnabled && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-16" style={{ color: 'var(--color-text-tertiary)' }}>Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={local.soundEffectsVolume}
                    onChange={(e) => handleChange('soundEffectsVolume', parseFloat(e.target.value))}
                    disabled={disabled}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span className="text-xs w-8" style={{ color: 'var(--color-text-secondary)' }}>
                    {Math.round(local.soundEffectsVolume * 100)}%
                  </span>
                </div>

                {/* Sound effect test buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {SOUND_EFFECTS.map(({ type, emoji, label }) => {
                    const isHovered = hoveredEffect === type
                    return (
                      <button
                        key={type}
                        onClick={() => testSoundEffect(type)}
                        onMouseEnter={() => setHoveredEffect(type)}
                        onMouseLeave={() => setHoveredEffect(null)}
                        disabled={disabled || testingSound === type}
                        className="p-2 rounded-lg text-center transition-all disabled:opacity-50"
                        style={{
                          background: isHovered ? 'var(--color-surface-alt)' : 'var(--color-surface-elevated)',
                          boxShadow: testingSound === type ? `0 0 0 2px var(--color-accent)` : 'none',
                        }}
                      >
                        <div className="text-xl">{emoji}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--color-accent) 50%, transparent)' }} />

          {/* Voice/TTS Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Text-to-Speech</span>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>AI co-stars speak their lines</p>
              </div>
              <button
                onClick={() => handleChange('voiceEnabled', !local.voiceEnabled)}
                disabled={disabled}
                className="disabled:opacity-50"
                role="switch"
                aria-checked={local.voiceEnabled}
                aria-label="Voice narration"
                style={{ width: 48, height: 24, borderRadius: '9999px', position: 'relative', cursor: 'pointer', border: 'none', background: local.voiceEnabled ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
              >
                <motion.div
                  animate={{ x: local.voiceEnabled ? 24 : 2 }}
                  style={{ position: 'absolute', top: 2, width: 20, height: 20, background: 'white', borderRadius: '9999px' }}
                />
              </button>
            </div>

            {local.voiceEnabled && (
              <div className="space-y-3 pl-4" style={{ borderLeft: '2px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-16" style={{ color: 'var(--color-text-tertiary)' }}>Speed</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={local.voiceSettings.speed}
                    onChange={(e) => handleChange('voiceSettings', {
                      ...local.voiceSettings,
                      speed: parseFloat(e.target.value)
                    })}
                    disabled={disabled}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span className="text-xs w-8" style={{ color: 'var(--color-text-secondary)' }}>
                    {local.voiceSettings.speed.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs w-16" style={{ color: 'var(--color-text-tertiary)' }}>Pitch</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={local.voiceSettings.pitch}
                    onChange={(e) => handleChange('voiceSettings', {
                      ...local.voiceSettings,
                      pitch: parseFloat(e.target.value)
                    })}
                    disabled={disabled}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span className="text-xs w-8" style={{ color: 'var(--color-text-secondary)' }}>
                    {local.voiceSettings.pitch.toFixed(1)}x
                  </span>
                </div>

                <button
                  onClick={testVoice}
                  onMouseEnter={() => setHoveredTestVoice(true)}
                  onMouseLeave={() => setHoveredTestVoice(false)}
                  disabled={disabled}
                  className="w-full p-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  style={{
                    background: hoveredTestVoice ? 'var(--color-surface-alt)' : 'var(--color-surface-elevated)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Test Voice
                </button>
              </div>
            )}
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--color-accent) 50%, transparent)' }} />

          {/* Ambience Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Background Ambience</span>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Setting-appropriate background audio</p>
              </div>
              <button
                onClick={() => handleChange('ambienceEnabled', !local.ambienceEnabled)}
                disabled={disabled}
                className="disabled:opacity-50"
                role="switch"
                aria-checked={local.ambienceEnabled}
                aria-label="Ambient music"
                style={{ width: 48, height: 24, borderRadius: '9999px', position: 'relative', cursor: 'pointer', border: 'none', background: local.ambienceEnabled ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
              >
                <motion.div
                  animate={{ x: local.ambienceEnabled ? 24 : 2 }}
                  style={{ position: 'absolute', top: 2, width: 20, height: 20, background: 'white', borderRadius: '9999px' }}
                />
              </button>
            </div>

            {local.ambienceEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-xs w-16" style={{ color: 'var(--color-text-tertiary)' }}>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={local.ambienceVolume}
                  onChange={(e) => handleChange('ambienceVolume', parseFloat(e.target.value))}
                  disabled={disabled}
                  className="flex-1"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <span className="text-xs w-8" style={{ color: 'var(--color-text-secondary)' }}>
                  {Math.round(local.ambienceVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--color-accent) 50%, transparent)' }} />

          {/* Turn Chime */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Turn Notification</span>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Chime when it&apos;s your line</p>
            </div>
            <button
              onClick={() => handleChange('turnChimeEnabled', !local.turnChimeEnabled)}
              disabled={disabled}
              className="disabled:opacity-50"
              role="switch"
              aria-checked={local.turnChimeEnabled}
              aria-label="Turn chime"
              style={{ width: 48, height: 24, borderRadius: '9999px', position: 'relative', cursor: 'pointer', border: 'none', background: local.turnChimeEnabled ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
            >
              <motion.div
                animate={{ x: local.turnChimeEnabled ? 24 : 2 }}
                style={{ position: 'absolute', top: 2, width: 20, height: 20, background: 'white', borderRadius: '9999px' }}
              />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
