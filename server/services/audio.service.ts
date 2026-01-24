/**
 * Audio Service
 * Handles text-to-speech generation and sound effect management
 */

import type {
  AudioSettings,
  VoiceSettings,
  SoundEffectType,
  ScriptLine,
  ScriptLineWithAudio,
  ScriptWithAudio,
  Script,
  DEFAULT_AUDIO_SETTINGS
} from '../../lib/types'

// Sound effect URLs (would be served from public/sounds/)
const SOUND_EFFECT_URLS: Record<SoundEffectType, string> = {
  door_slam: '/sounds/door-slam.mp3',
  laugh_track: '/sounds/laugh-track.mp3',
  dramatic_sting: '/sounds/dramatic-sting.mp3',
  applause: '/sounds/applause.mp3',
  record_scratch: '/sounds/record-scratch.mp3',
  crickets: '/sounds/crickets.mp3',
  explosion: '/sounds/explosion.mp3',
  magic_sparkle: '/sounds/magic-sparkle.mp3'
}

// Ambience tracks by setting type
const AMBIENCE_TRACKS: Record<string, string> = {
  office: '/sounds/ambience/office-chatter.mp3',
  restaurant: '/sounds/ambience/restaurant.mp3',
  space: '/sounds/ambience/space-hum.mp3',
  outdoors: '/sounds/ambience/nature.mp3',
  city: '/sounds/ambience/city-traffic.mp3',
  horror: '/sounds/ambience/creepy.mp3',
  medieval: '/sounds/ambience/tavern.mp3',
  default: '/sounds/ambience/soft-background.mp3'
}

// Voice style mappings for different moods
const MOOD_VOICE_STYLES: Record<string, { rate: number, pitch: number }> = {
  angry: { rate: 1.1, pitch: 0.9 },
  happy: { rate: 1.05, pitch: 1.1 },
  confused: { rate: 0.95, pitch: 1.05 },
  whispering: { rate: 0.85, pitch: 0.95 },
  neutral: { rate: 1.0, pitch: 1.0 }
}

// Character voice presets (speaker name patterns to voice styles)
const CHARACTER_VOICE_PRESETS: Array<{ pattern: RegExp, voiceHint: string }> = [
  { pattern: /yoda/i, voiceHint: 'elder-wise' },
  { pattern: /darth|vader/i, voiceHint: 'deep-menacing' },
  { pattern: /batman/i, voiceHint: 'gravelly-whisper' },
  { pattern: /pirate|captain/i, voiceHint: 'gruff-accent' },
  { pattern: /robot|android|ai/i, voiceHint: 'monotone-digital' },
  { pattern: /child|kid|young/i, voiceHint: 'high-pitched' },
  { pattern: /elderly|old|grandma|grandpa/i, voiceHint: 'elderly-warm' },
  { pattern: /ghost|spirit/i, voiceHint: 'ethereal-echo' }
]

/**
 * Get the sound effect URL for a given type
 */
export function getSoundEffectUrl(effect: SoundEffectType): string {
  return SOUND_EFFECT_URLS[effect] || SOUND_EFFECT_URLS.dramatic_sting
}

/**
 * Get all available sound effects
 */
export function getAvailableSoundEffects(): SoundEffectType[] {
  return Object.keys(SOUND_EFFECT_URLS) as SoundEffectType[]
}

/**
 * Determine ambience track based on setting
 */
export function getAmbienceTrack(setting: string): string {
  const lowerSetting = setting.toLowerCase()

  for (const [keyword, track] of Object.entries(AMBIENCE_TRACKS)) {
    if (lowerSetting.includes(keyword)) {
      return track
    }
  }

  // Check for common setting patterns
  if (lowerSetting.includes('office') || lowerSetting.includes('work')) {
    return AMBIENCE_TRACKS.office
  }
  if (lowerSetting.includes('restaurant') || lowerSetting.includes('cafe') || lowerSetting.includes('diner')) {
    return AMBIENCE_TRACKS.restaurant
  }
  if (lowerSetting.includes('space') || lowerSetting.includes('ship') || lowerSetting.includes('station')) {
    return AMBIENCE_TRACKS.space
  }
  if (lowerSetting.includes('haunt') || lowerSetting.includes('creep') || lowerSetting.includes('dark')) {
    return AMBIENCE_TRACKS.horror
  }
  if (lowerSetting.includes('castle') || lowerSetting.includes('medieval') || lowerSetting.includes('tavern')) {
    return AMBIENCE_TRACKS.medieval
  }

  return AMBIENCE_TRACKS.default
}

/**
 * Get voice style hints for a character
 */
export function getCharacterVoiceHint(speaker: string): string | null {
  for (const preset of CHARACTER_VOICE_PRESETS) {
    if (preset.pattern.test(speaker)) {
      return preset.voiceHint
    }
  }
  return null
}

/**
 * Adjust voice settings based on mood
 */
export function adjustVoiceForMood(
  baseSettings: VoiceSettings,
  mood: string
): VoiceSettings {
  const moodStyle = MOOD_VOICE_STYLES[mood] || MOOD_VOICE_STYLES.neutral

  return {
    ...baseSettings,
    speed: baseSettings.speed * moodStyle.rate,
    pitch: baseSettings.pitch * moodStyle.pitch
  }
}

/**
 * Generate a simple browser TTS request object
 */
export function generateBrowserTTSConfig(
  text: string,
  settings: VoiceSettings,
  mood: string
): {
  text: string
  rate: number
  pitch: number
  volume: number
} {
  const adjustedSettings = adjustVoiceForMood(settings, mood)

  return {
    text,
    rate: Math.max(0.5, Math.min(2, adjustedSettings.speed)),
    pitch: Math.max(0.5, Math.min(2, adjustedSettings.pitch)),
    volume: Math.max(0, Math.min(1, adjustedSettings.volume))
  }
}

/**
 * Detect potential sound effects from line content
 */
export function detectSoundEffect(text: string): SoundEffectType | null {
  const lowerText = text.toLowerCase()

  // Check for explicit stage directions or keywords
  if (lowerText.includes('[door') || lowerText.includes('slams door') || lowerText.includes('door slam')) {
    return 'door_slam'
  }
  if (lowerText.includes('[explosion') || lowerText.includes('explodes')) {
    return 'explosion'
  }
  if (lowerText.includes('[record scratch') || lowerText.includes('wait what')) {
    return 'record_scratch'
  }
  if (lowerText.includes('[crickets') || lowerText.includes('awkward silence')) {
    return 'crickets'
  }
  if (lowerText.includes('[applause') || lowerText.includes('crowd cheers')) {
    return 'applause'
  }
  if (lowerText.includes('[magic') || lowerText.includes('sparkle') || lowerText.includes('poof')) {
    return 'magic_sparkle'
  }
  if (lowerText.includes('[dramatic') || lowerText.includes('dun dun')) {
    return 'dramatic_sting'
  }

  return null
}

/**
 * Detect stage directions in a line
 */
export function detectStageDirection(text: string): string | null {
  // Look for bracketed stage directions
  const bracketMatch = text.match(/\[([^\]]+)\]/)
  if (bracketMatch) {
    return bracketMatch[1]
  }

  // Look for parenthetical directions
  const parenMatch = text.match(/\(([^)]+)\)/)
  if (parenMatch && parenMatch[1].length < 50) {
    return parenMatch[1]
  }

  return null
}

/**
 * Enhance a script with audio metadata
 */
export function enhanceScriptWithAudio(
  script: Script,
  audioSettings: AudioSettings,
  setting: string
): ScriptWithAudio {
  const enhancedLines: ScriptLineWithAudio[] = script.lines.map(line => {
    const enhanced: ScriptLineWithAudio = {
      ...line,
      soundEffect: audioSettings.soundEffectsEnabled
        ? detectSoundEffect(line.text) || undefined
        : undefined,
      stageDirection: detectStageDirection(line.text) || undefined
    }

    return enhanced
  })

  return {
    title: script.title,
    synopsis: script.synopsis,
    lines: enhancedLines,
    ambienceTrack: audioSettings.ambienceEnabled
      ? getAmbienceTrack(setting)
      : undefined
  }
}

/**
 * Get speaker list from script for audio preparation
 */
export function getSpeakersFromScript(script: Script): string[] {
  const speakers = new Set<string>()
  for (const line of script.lines) {
    if (line.speaker && !line.speaker.startsWith('[')) {
      speakers.add(line.speaker)
    }
  }
  return Array.from(speakers)
}

/**
 * Estimate audio duration for a line (for timing purposes)
 */
export function estimateLineDuration(text: string, wordsPerMinute: number = 150): number {
  const words = text.split(/\s+/).length
  return (words / wordsPerMinute) * 60 * 1000 // Returns milliseconds
}

/**
 * Create a placeholder audio settings object
 */
export function createDefaultAudioSettings(): AudioSettings {
  return {
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
}

/**
 * Validate audio settings
 */
export function validateAudioSettings(settings: Partial<AudioSettings>): AudioSettings {
  const defaults = createDefaultAudioSettings()

  return {
    voiceEnabled: settings.voiceEnabled ?? defaults.voiceEnabled,
    voiceSettings: settings.voiceSettings ? {
      enabled: settings.voiceSettings.enabled ?? defaults.voiceSettings.enabled,
      provider: settings.voiceSettings.provider ?? defaults.voiceSettings.provider,
      speed: Math.max(0.5, Math.min(2, settings.voiceSettings.speed ?? defaults.voiceSettings.speed)),
      pitch: Math.max(0.5, Math.min(2, settings.voiceSettings.pitch ?? defaults.voiceSettings.pitch)),
      volume: Math.max(0, Math.min(1, settings.voiceSettings.volume ?? defaults.voiceSettings.volume)),
      voiceId: settings.voiceSettings.voiceId
    } : defaults.voiceSettings,
    soundEffectsEnabled: settings.soundEffectsEnabled ?? defaults.soundEffectsEnabled,
    soundEffectsVolume: Math.max(0, Math.min(1, settings.soundEffectsVolume ?? defaults.soundEffectsVolume)),
    ambienceEnabled: settings.ambienceEnabled ?? defaults.ambienceEnabled,
    ambienceVolume: Math.max(0, Math.min(1, settings.ambienceVolume ?? defaults.ambienceVolume)),
    turnChimeEnabled: settings.turnChimeEnabled ?? defaults.turnChimeEnabled
  }
}

/**
 * Get audio file manifest for preloading
 */
export function getAudioManifest(): {
  soundEffects: Record<SoundEffectType, string>,
  ambienceTracks: Record<string, string>
} {
  return {
    soundEffects: { ...SOUND_EFFECT_URLS },
    ambienceTracks: { ...AMBIENCE_TRACKS }
  }
}
