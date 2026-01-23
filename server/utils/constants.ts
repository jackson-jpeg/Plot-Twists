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

export const AI_MAX_TOKENS = {
  ENSEMBLE: 10000,
  DEFAULT: 8192
} as const

export const AI_TEMPERATURE = 1 // Maximum creativity
