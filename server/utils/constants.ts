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

export const DISCONNECT_GRACE_PERIOD = 3000 // 3 seconds
export const VOTING_TIMEOUT = 60_000 // 60 seconds — auto-resolve if not all players vote

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
