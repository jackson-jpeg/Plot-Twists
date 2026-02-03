/**
 * Audience Interaction Service
 * Handles live reactions, plot twist voting, and spectator engagement
 */

import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import type {
  AudienceReaction,
  AudienceReactionType,
  AudienceInteractionState,
  PlotTwistOption,
  ScriptLine,
  Script,
  ComedyStyle
} from '../../lib/types'

// Initialize Anthropic client for AI-powered twists
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Rate limiting for reactions (per user)
const reactionCooldowns = new Map<string, number>()
const REACTION_COOLDOWN_MS = 2000 // 2 seconds between reactions

// Plot twist templates based on common scenarios
const PLOT_TWIST_TEMPLATES = {
  interruption: [
    "Someone's phone starts ringing loudly!",
    "A pizza delivery person arrives at the worst time!",
    "The fire alarm goes off!",
    "A celebrity look-alike walks in!",
    "Someone's ex shows up unexpectedly!"
  ],
  revelation: [
    "One character reveals they've been recording everything!",
    "It turns out they're all related!",
    "Someone confesses they're actually a time traveler!",
    "A secret twin is revealed!",
    "One character admits they can't actually read!"
  ],
  environment: [
    "The lights suddenly go out!",
    "An earthquake shakes the building!",
    "It starts raining indoors!",
    "A wild animal enters the scene!",
    "The room starts filling with fog!"
  ],
  escalation: [
    "The stakes just doubled!",
    "A countdown timer appears - 60 seconds!",
    "Everything must now be done in slow motion!",
    "Everyone must speak in rhymes!",
    "The scene becomes a musical number!"
  ]
}

/**
 * Initialize audience interaction state for a room
 */
export function initializeAudienceState(): AudienceInteractionState {
  return {
    reactions: [],
    reactionCounts: {
      laugh: 0,
      cheer: 0,
      gasp: 0,
      boo: 0,
      applause: 0
    },
    plotTwistHistory: []
  }
}

/**
 * Check if a user can send a reaction (rate limiting)
 */
export function canSendReaction(senderId: string): boolean {
  const lastReaction = reactionCooldowns.get(senderId)
  if (!lastReaction) return true
  return Date.now() - lastReaction >= REACTION_COOLDOWN_MS
}

/**
 * Record a reaction and update cooldown
 */
export function recordReaction(
  state: AudienceInteractionState,
  type: AudienceReactionType,
  senderId: string,
  senderName: string
): AudienceReaction | null {
  if (!canSendReaction(senderId)) {
    return null
  }

  const reaction: AudienceReaction = {
    id: uuidv4(),
    type,
    senderId,
    senderName,
    timestamp: Date.now()
  }

  // Update cooldown
  reactionCooldowns.set(senderId, Date.now())

  // Add to reactions list (keep last 100)
  state.reactions.push(reaction)
  if (state.reactions.length > 100) {
    state.reactions.shift()
  }

  // Update counts
  state.reactionCounts[type]++

  return reaction
}

/**
 * Get aggregated reaction counts
 */
export function getReactionCounts(state: AudienceInteractionState): Record<AudienceReactionType, number> {
  return { ...state.reactionCounts }
}

/**
 * Generate plot twist options based on current context
 */
export function generatePlotTwistOptions(
  setting?: string,
  currentMood?: string
): PlotTwistOption[] {
  // Select random options from different categories
  const categories = Object.keys(PLOT_TWIST_TEMPLATES) as (keyof typeof PLOT_TWIST_TEMPLATES)[]
  const selectedOptions: PlotTwistOption[] = []

  // Pick one from each category (4 options total)
  for (const category of categories) {
    const templates = PLOT_TWIST_TEMPLATES[category]
    const randomIndex = Math.floor(Math.random() * templates.length)
    selectedOptions.push({
      id: uuidv4(),
      text: templates[randomIndex],
      votes: 0
    })
  }

  // Shuffle the options
  return selectedOptions.sort(() => Math.random() - 0.5)
}

/**
 * Start a plot twist vote
 * Uses pre-generated AI options if available, falls back to templates
 */
export function startPlotTwist(
  state: AudienceInteractionState,
  durationMs: number = 15000,
  roomCode?: string
): { id: string, options: PlotTwistOption[], expiresAt: number } {
  // Try to use pre-generated AI twists first
  let options: PlotTwistOption[]
  if (roomCode) {
    const preGenerated = getPreGeneratedTwists(roomCode)
    if (preGenerated && preGenerated.length > 0) {
      // Use pre-generated and clear the cache
      options = preGenerated.map(opt => ({ ...opt, votes: 0 }))
      clearPreGeneratedTwists(roomCode)
      console.log(`🎭 Using pre-generated AI twists for room ${roomCode}`)
    } else {
      options = generatePlotTwistOptions()
      console.log(`🎭 Using template twists for room ${roomCode} (no pre-generated available)`)
    }
  } else {
    options = generatePlotTwistOptions()
  }

  const twist = {
    id: uuidv4(),
    options,
    expiresAt: Date.now() + durationMs,
    isActive: true
  }

  state.activePlotTwist = twist

  return {
    id: twist.id,
    options: twist.options,
    expiresAt: twist.expiresAt
  }
}

/**
 * Record a vote for a plot twist option
 */
export function votePlotTwist(
  state: AudienceInteractionState,
  optionId: string,
  voterId: string
): { success: boolean, newCount?: number } {
  if (!state.activePlotTwist || !state.activePlotTwist.isActive) {
    return { success: false }
  }

  if (Date.now() > state.activePlotTwist.expiresAt) {
    state.activePlotTwist.isActive = false
    return { success: false }
  }

  const option = state.activePlotTwist.options.find(o => o.id === optionId)
  if (!option) {
    return { success: false }
  }

  option.votes++
  return { success: true, newCount: option.votes }
}

/**
 * Finalize plot twist voting and get the winner
 */
export function finalizePlotTwist(state: AudienceInteractionState): string | null {
  if (!state.activePlotTwist) {
    return null
  }

  // Find the winning option (most votes, or random if tie)
  const options = state.activePlotTwist.options
  const maxVotes = Math.max(...options.map(o => o.votes))
  const winners = options.filter(o => o.votes === maxVotes)
  const winner = winners[Math.floor(Math.random() * winners.length)]

  // Record in history
  state.plotTwistHistory.push(winner.text)

  // Clear active twist
  state.activePlotTwist = undefined

  return winner.text
}

/**
 * Generate script lines to inject based on the winning plot twist
 */
export function generateTwistInjection(
  twistText: string,
  currentSpeakers: string[]
): ScriptLine[] {
  // Generate 2-3 reaction lines to the twist
  const lines: ScriptLine[] = []

  // Stage direction / narrator line
  lines.push({
    speaker: '[NARRATOR]',
    text: `PLOT TWIST: ${twistText}`,
    mood: 'neutral'
  })

  // Random reaction from one of the speakers
  if (currentSpeakers.length > 0) {
    const reactor = currentSpeakers[Math.floor(Math.random() * currentSpeakers.length)]
    const reactions = [
      { text: "Wait, what?! Did that just happen?!", mood: 'confused' as const },
      { text: "Oh no, this changes everything!", mood: 'confused' as const },
      { text: "Well, I did NOT see that coming!", mood: 'confused' as const },
      { text: "Okay, okay, we can work with this!", mood: 'happy' as const },
      { text: "You've got to be kidding me right now!", mood: 'angry' as const }
    ]
    const reaction = reactions[Math.floor(Math.random() * reactions.length)]
    lines.push({
      speaker: reactor,
      text: reaction.text,
      mood: reaction.mood
    })
  }

  return lines
}

/**
 * Reset reaction counts (called at start of new performance)
 */
export function resetReactionCounts(state: AudienceInteractionState): void {
  state.reactionCounts = {
    laugh: 0,
    cheer: 0,
    gasp: 0,
    boo: 0,
    applause: 0
  }
  state.reactions = []
}

/**
 * Clean up cooldowns for disconnected users
 */
export function cleanupCooldowns(): void {
  const now = Date.now()
  const expiry = 5 * 60 * 1000 // 5 minutes

  for (const [userId, timestamp] of reactionCooldowns.entries()) {
    if (now - timestamp > expiry) {
      reactionCooldowns.delete(userId)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupCooldowns, 5 * 60 * 1000)

// ============================================================
// AI-Powered Plot Twist Generation
// ============================================================

interface PlotTwistContext {
  setting: string
  characters: string[]
  recentDialogue: ScriptLine[]
  scriptPosition: 'early' | 'mid' | 'late'
  comedyStyle?: ComedyStyle
  isMature: boolean
}

// Store pre-generated twists per room
const preGeneratedTwists = new Map<string, PlotTwistOption[]>()

/**
 * Get pre-generated twists for a room (if available)
 */
export function getPreGeneratedTwists(roomCode: string): PlotTwistOption[] | null {
  return preGeneratedTwists.get(roomCode) || null
}

/**
 * Clear pre-generated twists for a room
 */
export function clearPreGeneratedTwists(roomCode: string): void {
  preGeneratedTwists.delete(roomCode)
}

/**
 * Generate AI-powered plot twist options specific to the current scene
 */
export async function generateAIPlotTwistOptions(
  roomCode: string,
  context: PlotTwistContext
): Promise<PlotTwistOption[]> {
  try {
    const { setting, characters, recentDialogue, scriptPosition, comedyStyle, isMature } = context

    const recentLines = recentDialogue
      .slice(-5)
      .map(line => `${line.speaker}: "${line.text}"`)
      .join('\n')

    const prompt = `You are generating plot twist options for a live comedy improv game. The audience will vote on which twist to inject into the scene.

CURRENT SCENE CONTEXT:
- Setting: ${setting}
- Characters: ${characters.join(', ')}
- Position in script: ${scriptPosition} (${scriptPosition === 'early' ? 'just started' : scriptPosition === 'mid' ? 'building momentum' : 'approaching climax'})
- Comedy style: ${comedyStyle || 'witty'}
- Rating: ${isMature ? '18+ (adult comedy allowed)' : 'Family friendly'}

RECENT DIALOGUE:
${recentLines || '(Scene just started)'}

Generate exactly 4 plot twist options. Each twist should:
1. Be SPECIFIC to this scene (mention character names, setting details, or callback to dialogue)
2. Be chaotic and funny, not just random
3. Force the characters to react and adapt
4. Fit the comedy style and rating

Categories to cover (one each):
- INTERRUPTION: Someone/something bursts into the scene
- REVELATION: A shocking secret is revealed about a character or situation
- ENVIRONMENT: The setting itself changes or does something unexpected
- ESCALATION: A rule change or stakes increase that affects everyone

Return ONLY a JSON array with exactly 4 objects:
[
  { "text": "Twist text here (10-20 words max)" },
  { "text": "..." },
  { "text": "..." },
  { "text": "..." }
]

Make them hilarious and scene-specific. No generic twists.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 1.0,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonText) as { text: string }[]

    const options: PlotTwistOption[] = parsed.map(item => ({
      id: uuidv4(),
      text: item.text,
      votes: 0
    }))

    // Cache for this room
    preGeneratedTwists.set(roomCode, options)

    console.log(`🎭 AI generated ${options.length} plot twists for room ${roomCode}`)
    return options
  } catch (error) {
    console.error('❌ AI plot twist generation failed, using templates:', error)
    // Fall back to template-based generation
    return generatePlotTwistOptions()
  }
}

/**
 * Generate AI-powered character-appropriate reactions to a plot twist
 */
export async function generateAITwistInjection(
  twistText: string,
  characters: string[],
  context: PlotTwistContext
): Promise<ScriptLine[]> {
  try {
    const { setting, comedyStyle, isMature, recentDialogue } = context

    const recentLines = recentDialogue
      .slice(-3)
      .map(line => `${line.speaker}: "${line.text}"`)
      .join('\n')

    const prompt = `A plot twist just happened in a live comedy improv scene. Generate character reactions.

THE TWIST: "${twistText}"

SCENE CONTEXT:
- Setting: ${setting}
- Characters: ${characters.join(', ')}
- Comedy style: ${comedyStyle || 'witty'}
- Rating: ${isMature ? '18+ adult' : 'Family friendly'}

LINES JUST BEFORE THE TWIST:
${recentLines || '(Scene just started)'}

Generate 3-4 reaction lines from the characters. CRITICAL RULES:
1. Each character MUST speak in their authentic voice (Yoda inverts sentences, pirates say "arr", robots speak formally, etc.)
2. NO narrator lines - pure character dialogue only
3. Reactions should acknowledge the twist AND be funny
4. Characters can disagree about how to handle it
5. Keep lines punchy (under 20 words each)
6. Include at least one physical comedy beat described in dialogue ("Why are you hiding under the table?")

Return ONLY a JSON array:
[
  { "speaker": "Character Name", "text": "Their reaction", "mood": "angry|happy|confused|whispering|neutral" },
  ...
]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonText) as ScriptLine[]

    console.log(`🎭 AI generated ${parsed.length} twist reaction lines`)
    return parsed
  } catch (error) {
    console.error('❌ AI twist injection failed, using templates:', error)
    // Fall back to template-based injection
    return generateTwistInjection(twistText, characters)
  }
}

/**
 * Pre-generate twist options in the background when a script loads
 */
export function preGenerateTwistsForRoom(
  roomCode: string,
  script: Script,
  setting: string,
  isMature: boolean,
  comedyStyle?: ComedyStyle
): void {
  // Extract characters from script
  const characters = [...new Set(
    script.lines
      .map(l => l.speaker)
      .filter(s => !s.startsWith('['))
  )]

  const context: PlotTwistContext = {
    setting,
    characters,
    recentDialogue: script.lines.slice(0, 5),
    scriptPosition: 'early',
    comedyStyle,
    isMature
  }

  // Generate in background (don't await)
  generateAIPlotTwistOptions(roomCode, context).catch(err => {
    console.error(`Failed to pre-generate twists for room ${roomCode}:`, err)
  })
}

/**
 * Regenerate twists in background after one is used
 */
export function regenerateTwistsForRoom(
  roomCode: string,
  script: Script,
  currentLineIndex: number,
  setting: string,
  isMature: boolean,
  comedyStyle?: ComedyStyle
): void {
  const characters = [...new Set(
    script.lines
      .map(l => l.speaker)
      .filter(s => !s.startsWith('['))
  )]

  const totalLines = script.lines.length
  const position = currentLineIndex / totalLines
  const scriptPosition: 'early' | 'mid' | 'late' =
    position < 0.33 ? 'early' : position < 0.66 ? 'mid' : 'late'

  const context: PlotTwistContext = {
    setting,
    characters,
    recentDialogue: script.lines.slice(Math.max(0, currentLineIndex - 5), currentLineIndex + 1),
    scriptPosition,
    comedyStyle,
    isMature
  }

  // Generate in background
  generateAIPlotTwistOptions(roomCode, context).catch(err => {
    console.error(`Failed to regenerate twists for room ${roomCode}:`, err)
  })
}
