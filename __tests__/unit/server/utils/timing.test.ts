import { calculateLineDisplayTime } from '../../../../server/utils/timing'
import {
  MIN_LINE_DISPLAY_TIME,
  MAX_LINE_DISPLAY_TIME
} from '../../../../server/utils/constants'
import type { ScriptLine } from '../../../../lib/types'

function makeLine(overrides: Partial<ScriptLine> = {}): ScriptLine {
  return {
    speaker: 'Character',
    text: 'Hello world',
    mood: 'neutral',
    ...overrides
  }
}

describe('calculateLineDisplayTime', () => {
  describe('basic timing', () => {
    it('should return a positive number', () => {
      const time = calculateLineDisplayTime(makeLine())
      expect(time).toBeGreaterThan(0)
    })

    it('should respect minimum display time', () => {
      const time = calculateLineDisplayTime(makeLine({ text: 'Hi' }))
      expect(time).toBeGreaterThanOrEqual(MIN_LINE_DISPLAY_TIME)
    })

    it('should respect maximum display time', () => {
      const longText = Array(200).fill('word').join(' ')
      const time = calculateLineDisplayTime(makeLine({ text: longText }))
      expect(time).toBeLessThanOrEqual(MAX_LINE_DISPLAY_TIME)
    })

    it('should give longer time to longer text', () => {
      const shortTime = calculateLineDisplayTime(makeLine({ text: 'Hello' }))
      const longTime = calculateLineDisplayTime(
        makeLine({ text: 'This is a much longer line with many more words to read' })
      )
      expect(longTime).toBeGreaterThan(shortTime)
    })
  })

  describe('punctuation pauses', () => {
    it('should add extra time for periods', () => {
      const noPunctuation = calculateLineDisplayTime(makeLine({ text: 'Hello world today' }))
      const withPeriod = calculateLineDisplayTime(makeLine({ text: 'Hello. World. Today.' }))
      expect(withPeriod).toBeGreaterThan(noPunctuation)
    })

    it('should add extra time for exclamation marks', () => {
      const base = calculateLineDisplayTime(makeLine({ text: 'She walked into the room and sat down quietly' }))
      const withExclamation = calculateLineDisplayTime(makeLine({ text: 'She walked into the room and sat down quietly!' }))
      expect(withExclamation).toBeGreaterThan(base)
    })

    it('should add extra time for ellipsis', () => {
      const base = calculateLineDisplayTime(makeLine({ text: 'Hello world' }))
      const withEllipsis = calculateLineDisplayTime(makeLine({ text: 'Hello... world...' }))
      expect(withEllipsis).toBeGreaterThan(base)
    })
  })

  describe('mood multipliers', () => {
    it('should make angry lines faster', () => {
      const neutral = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'neutral' })
      )
      const angry = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'angry' })
      )
      expect(angry).toBeLessThan(neutral)
    })

    it('should make whispering lines slower', () => {
      const neutral = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'neutral' })
      )
      const whispering = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'whispering' })
      )
      expect(whispering).toBeGreaterThan(neutral)
    })

    it('should make confused lines slower', () => {
      const neutral = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'neutral' })
      )
      const confused = calculateLineDisplayTime(
        makeLine({ text: 'This is a test sentence with enough words', mood: 'confused' })
      )
      expect(confused).toBeGreaterThan(neutral)
    })

    it('should handle unknown mood as neutral', () => {
      const neutral = calculateLineDisplayTime(
        makeLine({ text: 'Test sentence', mood: 'neutral' })
      )
      const unknown = calculateLineDisplayTime(
        makeLine({ text: 'Test sentence', mood: 'unknown_mood' as ScriptLine['mood'] })
      )
      expect(unknown).toBe(neutral)
    })
  })

  describe('stage directions', () => {
    it('should handle NARRATOR as stage direction', () => {
      const time = calculateLineDisplayTime(
        makeLine({ speaker: 'NARRATOR', text: 'The room went quiet' })
      )
      expect(time).toBeGreaterThanOrEqual(MIN_LINE_DISPLAY_TIME)
      expect(time).toBeLessThanOrEqual(MAX_LINE_DISPLAY_TIME)
    })

    it('should handle STAGE DIRECTION speaker', () => {
      const time = calculateLineDisplayTime(
        makeLine({ speaker: 'STAGE DIRECTION', text: 'Everyone looks around' })
      )
      expect(time).toBeGreaterThanOrEqual(MIN_LINE_DISPLAY_TIME)
    })

    it('should not treat regular speakers as stage directions', () => {
      const regular = calculateLineDisplayTime(
        makeLine({ speaker: 'Bob', text: 'The room went quiet' })
      )
      const narrator = calculateLineDisplayTime(
        makeLine({ speaker: 'NARRATOR', text: 'The room went quiet' })
      )
      // They may differ since stage directions use different formula
      expect(regular).not.toBe(narrator)
    })
  })
})
