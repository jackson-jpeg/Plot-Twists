import { sanitizeInput, isValidRoomCode, isValidNickname, isValidUUID } from '../../../../server/utils/validation'

describe('Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<')
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('>')
      expect(sanitizeInput('Hello"World')).not.toContain('"')
      expect(sanitizeInput("Hello'World")).not.toContain("'")
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  Hello  ')).toBe('Hello')
    })

    it('should enforce max length', () => {
      const longString = 'a'.repeat(100)
      expect(sanitizeInput(longString).length).toBeLessThanOrEqual(50)
    })

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput('   ')).toBe('')
    })

    it('should preserve valid text', () => {
      expect(sanitizeInput('John Doe 123')).toBe('John Doe 123')
    })
  })

  describe('isValidRoomCode', () => {
    it('should accept valid 4-character room codes', () => {
      expect(isValidRoomCode('ABCD')).toBe(true)
      expect(isValidRoomCode('A2B3')).toBe(true)
      expect(isValidRoomCode('abcd')).toBe(true) // Should accept lowercase
    })

    it('should reject invalid room codes', () => {
      expect(isValidRoomCode('ABC')).toBe(false) // Too short
      expect(isValidRoomCode('ABCDE')).toBe(false) // Too long
      expect(isValidRoomCode('AB-D')).toBe(false) // Invalid character
      expect(isValidRoomCode('')).toBe(false)
      expect(isValidRoomCode('12345')).toBe(false)
    })

    it('should reject non-string inputs', () => {
      expect(isValidRoomCode(null as any)).toBe(false)
      expect(isValidRoomCode(undefined as any)).toBe(false)
      expect(isValidRoomCode(123 as any)).toBe(false)
    })
  })

  describe('isValidNickname', () => {
    it('should accept valid nicknames', () => {
      expect(isValidNickname('John')).toBe(true)
      expect(isValidNickname('Player123')).toBe(true)
      expect(isValidNickname('Cool Dude')).toBe(true)
    })

    it('should reject invalid nicknames', () => {
      expect(isValidNickname('')).toBe(false)
      expect(isValidNickname('   ')).toBe(false)
      expect(isValidNickname('a'.repeat(100))).toBe(false) // Too long
    })

    it('should reject non-string inputs', () => {
      expect(isValidNickname(null as any)).toBe(false)
      expect(isValidNickname(undefined as any)).toBe(false)
      expect(isValidNickname(123 as any)).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false) // Too short
    })

    it('should reject non-string inputs', () => {
      expect(isValidUUID(null as any)).toBe(false)
      expect(isValidUUID(undefined as any)).toBe(false)
      expect(isValidUUID(123 as any)).toBe(false)
    })
  })
})
