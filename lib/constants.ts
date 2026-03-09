// Client-safe constants shared across frontend components.
// Game rule constants (teleprompter timing, etc.) live in server/utils/constants.ts.

export const GAME_CONSTANTS = {
  maxNicknameLength: 50,
  roomCodeLength: 4,
  searchDebounceMs: 400,
  packLoadingTimeoutMs: 10_000,
  spectatorMessageBuffer: 50,
  featuredPacksLimit: 20,
  countdownDurationMs: 800,
  performingCountdownStart: 3,
  loadingTimeoutMs: 45_000,
} as const
