/**
 * Text-to-Speech Service
 * Handles TTS generation with multiple provider support
 */

import type { VoiceSettings, VoiceProvider } from '../../lib/types'

// Voice mapping for different providers
interface VoiceMapping {
  male: string[]
  female: string[]
  neutral: string[]
}

// OpenAI TTS voices
const OPENAI_VOICES: VoiceMapping = {
  male: ['alloy', 'echo', 'fable', 'onyx'],
  female: ['nova', 'shimmer'],
  neutral: ['alloy', 'fable']
}

// ElevenLabs default voices (free tier)
const ELEVENLABS_VOICES: VoiceMapping = {
  male: ['pNInz6obpgDQGcFmaJgB', 'VR6AewLTigWG4xSOukaG'], // Adam, Arnold
  female: ['EXAVITQu4vr4xnSDxMaL', 'MF3mGyEYCl7XYWbV9V6O'], // Bella, Elli
  neutral: ['pNInz6obpgDQGcFmaJgB'] // Adam
}

// Character name patterns to guess gender for voice selection
const FEMALE_PATTERNS = [
  /queen/i, /princess/i, /mom/i, /mother/i, /wife/i, /girl/i, /woman/i,
  /lady/i, /duchess/i, /empress/i, /goddess/i, /witch/i, /nurse/i,
  /grandma/i, /aunt/i, /sister/i, /daughter/i, /bride/i, /maid/i,
  // Common female names
  /mary/i, /jane/i, /elizabeth/i, /sarah/i, /emma/i, /olivia/i, /sophia/i
]

const MALE_PATTERNS = [
  /king/i, /prince/i, /dad/i, /father/i, /husband/i, /boy/i, /man/i,
  /lord/i, /duke/i, /emperor/i, /god(?!dess)/i, /wizard/i, /doctor/i,
  /grandpa/i, /uncle/i, /brother/i, /son/i, /groom/i, /butler/i,
  // Common male names
  /john/i, /james/i, /william/i, /david/i, /michael/i, /robert/i
]

/**
 * Guess gender from character name for voice selection
 */
function guessGenderFromName(characterName: string): 'male' | 'female' | 'neutral' {
  if (FEMALE_PATTERNS.some(pattern => pattern.test(characterName))) {
    return 'female'
  }
  if (MALE_PATTERNS.some(pattern => pattern.test(characterName))) {
    return 'male'
  }
  return 'neutral'
}

/**
 * Select a voice ID based on character and provider
 */
export function selectVoiceForCharacter(
  characterName: string,
  provider: VoiceProvider,
  existingVoiceAssignments: Map<string, string> = new Map()
): string {
  // If character already has an assigned voice, return it
  if (existingVoiceAssignments.has(characterName)) {
    return existingVoiceAssignments.get(characterName)!
  }

  const gender = guessGenderFromName(characterName)
  const voiceMap = provider === 'openai' ? OPENAI_VOICES : ELEVENLABS_VOICES

  // Get available voices for this gender
  const availableVoices = voiceMap[gender]

  // Get already used voices
  const usedVoices = new Set(existingVoiceAssignments.values())

  // Try to find an unused voice
  for (const voice of availableVoices) {
    if (!usedVoices.has(voice)) {
      return voice
    }
  }

  // If all voices are used, just pick one randomly
  return availableVoices[Math.floor(Math.random() * availableVoices.length)]
}

/**
 * Generate TTS audio using OpenAI's API
 */
export async function generateOpenAITTS(
  text: string,
  voiceId: string,
  settings: VoiceSettings
): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OpenAI API key not configured for TTS')
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voiceId,
        input: text,
        speed: settings.speed || 1.0
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI TTS error:', error)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('OpenAI TTS request failed:', error)
    return null
  }
}

/**
 * Generate TTS audio using ElevenLabs API
 */
export async function generateElevenLabsTTS(
  text: string,
  voiceId: string,
  settings: VoiceSettings
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error('ElevenLabs API key not configured for TTS')
    return null
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: settings.speed || 1.0
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs TTS error:', error)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('ElevenLabs TTS request failed:', error)
    return null
  }
}

/**
 * Generate TTS audio using the configured provider
 */
export async function generateLineAudio(
  text: string,
  speaker: string,
  voiceSettings: VoiceSettings,
  voiceAssignments: Map<string, string> = new Map()
): Promise<{ audioBuffer: Buffer | null; voiceId: string }> {
  const provider = voiceSettings.provider

  // Browser TTS is handled client-side
  if (provider === 'browser') {
    return { audioBuffer: null, voiceId: 'browser' }
  }

  // Select or get existing voice for this speaker
  const voiceId = voiceSettings.voiceId ||
    selectVoiceForCharacter(speaker, provider, voiceAssignments)

  let audioBuffer: Buffer | null = null

  switch (provider) {
    case 'openai':
      audioBuffer = await generateOpenAITTS(text, voiceId, voiceSettings)
      break
    case 'elevenlabs':
      audioBuffer = await generateElevenLabsTTS(text, voiceId, voiceSettings)
      break
    default:
      console.error(`Unknown TTS provider: ${provider}`)
  }

  return { audioBuffer, voiceId }
}

/**
 * Batch generate audio for all lines in a script
 * Returns a map of line index to audio URL (or null for browser TTS)
 */
export async function generateScriptAudio(
  lines: Array<{ speaker: string; text: string }>,
  voiceSettings: VoiceSettings
): Promise<Map<number, { audioBuffer: Buffer | null; voiceId: string }>> {
  const results = new Map<number, { audioBuffer: Buffer | null; voiceId: string }>()
  const voiceAssignments = new Map<string, string>()

  // Generate audio for each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const result = await generateLineAudio(
      line.text,
      line.speaker,
      voiceSettings,
      voiceAssignments
    )

    // Track voice assignments for consistency
    if (result.voiceId && result.voiceId !== 'browser') {
      voiceAssignments.set(line.speaker, result.voiceId)
    }

    results.set(i, result)
  }

  return results
}

/**
 * Convert audio buffer to base64 data URL
 */
export function audioBufferToDataUrl(buffer: Buffer, format: string = 'mp3'): string {
  const base64 = buffer.toString('base64')
  return `data:audio/${format};base64,${base64}`
}

/**
 * Check if TTS is available for a given provider
 */
export function isTTSAvailable(provider: VoiceProvider): boolean {
  switch (provider) {
    case 'browser':
      return true // Always available (client-side)
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'elevenlabs':
      return !!process.env.ELEVENLABS_API_KEY
    default:
      return false
  }
}

/**
 * Get available TTS providers based on configured API keys
 */
export function getAvailableTTSProviders(): VoiceProvider[] {
  const providers: VoiceProvider[] = ['browser']

  if (process.env.OPENAI_API_KEY) {
    providers.push('openai')
  }

  if (process.env.ELEVENLABS_API_KEY) {
    providers.push('elevenlabs')
  }

  return providers
}
