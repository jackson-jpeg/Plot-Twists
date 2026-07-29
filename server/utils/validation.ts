import { MAX_NICKNAME_LENGTH } from './constants'
import type { CardSelectionInput } from '../../lib/types'

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = MAX_NICKNAME_LENGTH): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
  if (typeof code !== 'string') {
    return false
  }

  const uppercaseCode = code.toUpperCase()
  return /^[A-Z0-9]{4}$/.test(uppercaseCode)
}

/**
 * Validate nickname
 */
export function isValidNickname(nickname: string): boolean {
  if (typeof nickname !== 'string') {
    return false
  }

  // Check length before sanitization
  const trimmed = nickname.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_NICKNAME_LENGTH) {
    return false
  }

  // Check that sanitization doesn't remove all characters
  const sanitized = sanitizeInput(nickname)
  return sanitized.length > 0
}

/**
 * Validate player ID format (UUID)
 */
export function isValidUUID(id: string): boolean {
  if (typeof id !== 'string') {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

const VALID_GAME_MODES = ['SOLO', 'HEAD_TO_HEAD', 'ENSEMBLE'] as const

/** Catalog IDs look like `char-michael-scott` / a uuid. Nothing else is an ID. */
const CARD_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/i

/**
 * Shape-check a `submit_cards` payload. IP layer 2 — see
 * `server/services/cardCatalog.service.ts` for the invariant this serves.
 *
 * This deliberately does NOT sanitise-and-accept. There is nothing to sanitise:
 * an ID either matches the ID grammar or the payload is not a selection. The
 * previous version took `{character, setting, circumstance}` free text, stripped
 * `<>'"` from it, truncated to 200 chars and passed it through to the Claude
 * prompt. That was defect D1, and stripping a bracket was never validation.
 *
 * Returning non-null here means "this is shaped like a selection", NOT "these
 * cards exist". Existence is `resolveCardSelection`, which needs the room.
 */
export function validateCardSelectionInput(selections: unknown): CardSelectionInput | null {
  if (!selections || typeof selections !== 'object' || Array.isArray(selections)) return null

  const sel = selections as Record<string, unknown>
  const { characterId, settingId, circumstanceId } = sel

  if (typeof characterId !== 'string' || typeof settingId !== 'string' || typeof circumstanceId !== 'string') {
    return null
  }

  if (
    !CARD_ID_PATTERN.test(characterId) ||
    !CARD_ID_PATTERN.test(settingId) ||
    !CARD_ID_PATTERN.test(circumstanceId)
  ) {
    return null
  }

  return { characterId, settingId, circumstanceId }
}

/**
 * Validate a game mode string.
 */
export function isValidGameMode(mode: unknown): mode is typeof VALID_GAME_MODES[number] {
  return typeof mode === 'string' && (VALID_GAME_MODES as readonly string[]).includes(mode)
}

/**
 * Validate phone number format (E.164).
 */
export function isValidPhoneNumber(phone: string): boolean {
  return typeof phone === 'string' && /^\+[1-9]\d{1,14}$/.test(phone)
}
