import { MAX_NICKNAME_LENGTH } from './constants'

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
    .replace(/&/g, '&amp;')
    .replace(/\//g, '')
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
