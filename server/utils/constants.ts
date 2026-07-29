/**
 * Application constants
 */

export const WORDS_PER_MINUTE = 120

export const ROOM_CODE_LENGTH = 4
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing characters

export const MAX_NICKNAME_LENGTH = 50
export const MAX_PLAYERS = {
  SOLO: 1,
  HEAD_TO_HEAD: 2,
  ENSEMBLE: 6
} as const

export const ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
export const ROOM_INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour

// Chunk 3 item 2 lives in utils/config.ts (CONFIG.abuse), not here — it needs to be tunable
// from the environment without a deploy. See the CGNAT note there.

export const DISCONNECT_GRACE_PERIOD = 3000 // 3 seconds
// Chunk 2 item 4: was 60_000. Sixty seconds is a long time to stare at "waiting for all players
// to cast their votes" when the missing vote belongs to someone who has left the room. The tally
// now also resolves the instant every CONNECTED player has voted (voting.service → allBallotsIn),
// so this timer only runs when someone actually present is simply not voting — and 25s is long
// enough to read a ballot, short enough that the party does not stall on one distracted person.
// Paired with `voting_deadline`, which puts the number on screen instead of leaving it silent.
export const VOTING_TIMEOUT = 25_000
export const PLOT_TWIST_VOTING_DURATION = 15_000 // 15 seconds for audience to vote on plot twists

export const AI_MAX_TOKENS = {
  ENSEMBLE: 10000,
  DEFAULT: 8192
} as const

export const AI_TEMPERATURE = 1 // Maximum creativity

// ============================================================
// Teleprompter Timing Constants
// ============================================================

// Punctuation pauses (milliseconds)
export const PUNCTUATION_PAUSES: Record<string, number> = {
  '.': 400,
  '!': 500,
  '?': 450,
  ',': 200,
  ':': 300,
  ';': 250,
  '...': 800,
  '--': 400
}

// Mood timing multipliers (faster/slower reading)
export const MOOD_TIMING_MULTIPLIERS: Record<string, number> = {
  angry: 0.9,      // Angry lines are delivered faster
  happy: 1.0,      // Normal pace
  confused: 1.2,   // Confused lines slower, more hesitation
  whispering: 1.3, // Whispered lines need more time
  neutral: 1.0     // Normal pace
}

// Stage direction base time (ms)
export const STAGE_DIRECTION_BASE_TIME = 2000

// Minimum/maximum line display times (ms)
export const MIN_LINE_DISPLAY_TIME = 1500
export const MAX_LINE_DISPLAY_TIME = 15000
