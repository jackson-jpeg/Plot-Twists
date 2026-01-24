/**
 * Audience Interaction Service
 * Handles live reactions, plot twist voting, and spectator engagement
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  AudienceReaction,
  AudienceReactionType,
  AudienceInteractionState,
  PlotTwistOption,
  ScriptLine
} from '../../lib/types'

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
 */
export function startPlotTwist(
  state: AudienceInteractionState,
  durationMs: number = 15000
): { id: string, options: PlotTwistOption[], expiresAt: number } {
  const options = generatePlotTwistOptions()
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
