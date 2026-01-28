'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { AudioSettings, SoundEffectType } from '@/lib/types'

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
      console.log('Sound test not available in preview')
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
    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔊</span>
          <div>
            <h3 className="font-semibold text-white">Audio Settings</h3>
            <p className="text-sm text-gray-400">
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
          {/* Sound Effects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Sound Effects</span>
              <button
                onClick={() => handleChange('soundEffectsEnabled', !local.soundEffectsEnabled)}
                disabled={disabled}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  local.soundEffectsEnabled ? 'bg-purple-600' : 'bg-gray-700'
                } disabled:opacity-50`}
              >
                <motion.div
                  animate={{ x: local.soundEffectsEnabled ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {local.soundEffectsEnabled && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={local.soundEffectsVolume}
                    onChange={(e) => handleChange('soundEffectsVolume', parseFloat(e.target.value))}
                    disabled={disabled}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-gray-400 w-8">
                    {Math.round(local.soundEffectsVolume * 100)}%
                  </span>
                </div>

                {/* Sound effect test buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {SOUND_EFFECTS.map(({ type, emoji, label }) => (
                    <button
                      key={type}
                      onClick={() => testSoundEffect(type)}
                      disabled={disabled || testingSound === type}
                      className={`p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-center transition-all ${
                        testingSound === type ? 'ring-2 ring-purple-500' : ''
                      } disabled:opacity-50`}
                    >
                      <div className="text-xl">{emoji}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Voice/TTS Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-300">Text-to-Speech</span>
                <p className="text-xs text-gray-500">AI co-stars speak their lines</p>
              </div>
              <button
                onClick={() => handleChange('voiceEnabled', !local.voiceEnabled)}
                disabled={disabled}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  local.voiceEnabled ? 'bg-purple-600' : 'bg-gray-700'
                } disabled:opacity-50`}
              >
                <motion.div
                  animate={{ x: local.voiceEnabled ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {local.voiceEnabled && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Speed</span>
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
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-gray-400 w-8">
                    {local.voiceSettings.speed.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Pitch</span>
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
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs text-gray-400 w-8">
                    {local.voiceSettings.pitch.toFixed(1)}x
                  </span>
                </div>

                <button
                  onClick={testVoice}
                  disabled={disabled}
                  className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
                >
                  Test Voice
                </button>
              </div>
            )}
          </div>

          {/* Ambience Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-300">Background Ambience</span>
                <p className="text-xs text-gray-500">Setting-appropriate background audio</p>
              </div>
              <button
                onClick={() => handleChange('ambienceEnabled', !local.ambienceEnabled)}
                disabled={disabled}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  local.ambienceEnabled ? 'bg-purple-600' : 'bg-gray-700'
                } disabled:opacity-50`}
              >
                <motion.div
                  animate={{ x: local.ambienceEnabled ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {local.ambienceEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={local.ambienceVolume}
                  onChange={(e) => handleChange('ambienceVolume', parseFloat(e.target.value))}
                  disabled={disabled}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-xs text-gray-400 w-8">
                  {Math.round(local.ambienceVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Turn Chime */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-300">Turn Notification</span>
              <p className="text-xs text-gray-500">Chime when it&apos;s your line</p>
            </div>
            <button
              onClick={() => handleChange('turnChimeEnabled', !local.turnChimeEnabled)}
              disabled={disabled}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                local.turnChimeEnabled ? 'bg-purple-600' : 'bg-gray-700'
              } disabled:opacity-50`}
            >
              <motion.div
                animate={{ x: local.turnChimeEnabled ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
