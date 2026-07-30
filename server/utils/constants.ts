/**
 * Application constants
 */

export const WORDS_PER_MINUTE = 120

export const ROOM_CODE_LENGTH = 4
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing characters

export const MAX_NICKNAME_LENGTH = 50

// THE seat cap. Single definition — every enforcement point, every piece of UI copy and every
// preview number derives from here. Nothing restates it as a literal; see lib/playerCounts.ts for
// the client-safe label helpers and __tests__/unit/server/utils/playerCounts.test.ts for the
// assertions that fail if a literal creeps back in.
//
// RAISED TO 8 ON 2026-07-30, by Jackson's decision. It was 6, while the lobby rendered "Max 8" and
// the scope-freeze condition is "played with eight people who are not my friends" — so the product
// could not seat the room its own UI advertised or its own release gate required. Joiners past the
// cap are not rejected; they become SPECTATORS, and only PLAYER-role selections become traits
// (game.helpers.ts), so the cap is also the ceiling on what reaches the model.
//
// What 8 does NOT touch, verified rather than assumed: MIN_PLAYERS (a floor), the 30-38 line
// budget and the 2,600 max_tokens ceiling (both constants, not functions of cast size), card
// dealing (per-room), and voting/results/progression (all iterate the player map).
export const MAX_PLAYERS = {
  SOLO: 1,
  HEAD_TO_HEAD: 2,
  ENSEMBLE: 8
} as const

// The floor: how many PLAYER-role seats must be filled before a round can start. Also the
// auto-start threshold for public rooms — matchmaking.service.ts imports this rather than keeping
// the second copy it used to own.
export const MIN_PLAYERS = {
  SOLO: 1,
  HEAD_TO_HEAD: 2,
  ENSEMBLE: 3
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

// `AI_MAX_TOKENS = { ENSEMBLE: 10000, DEFAULT: 8192 }` was here and is DELETED, 2026-07-30.
// Nothing imported it — a repo-wide grep for the identifier returned only its own declaration —
// but `INVENTORY.md` listed it among the live tuning constants, so the written record implied that
// an ENSEMBLE generation may spend 10,000 output tokens. The real ceiling is **2,600**, applied by
// `getMaxTokens()` in scriptCustomization.service.ts, and it is the number Jackson set. A dead
// constant that contradicts a live one by 4× is worse than no constant.

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
