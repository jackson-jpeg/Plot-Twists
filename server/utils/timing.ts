/**
 * Timing utilities for teleprompter sync
 */

import type { ScriptLine } from '../../lib/types'
import {
  WORDS_PER_MINUTE,
  PUNCTUATION_PAUSES,
  MOOD_TIMING_MULTIPLIERS,
  STAGE_DIRECTION_BASE_TIME,
  MIN_LINE_DISPLAY_TIME,
  MAX_LINE_DISPLAY_TIME
} from './constants'

/**
 * Calculate punctuation pauses in a text string
 * Returns total pause time in milliseconds
 */
function calculatePunctuationPauses(text: string): number {
  let totalPause = 0

  // Check for ellipsis first (before checking for periods)
  const ellipsisCount = (text.match(/\.\.\./g) || []).length
  totalPause += ellipsisCount * PUNCTUATION_PAUSES['...']

  // Remove ellipses to avoid double-counting periods
  const textWithoutEllipsis = text.replace(/\.\.\./g, '')

  // Count each punctuation mark
  for (const [punctuation, pause] of Object.entries(PUNCTUATION_PAUSES)) {
    if (punctuation === '...') continue // Already handled

    // Special handling for em-dash
    if (punctuation === '--') {
      const emDashCount = (textWithoutEllipsis.match(/--/g) || []).length
      totalPause += emDashCount * pause
    } else {
      // Use regex to count occurrences
      const regex = new RegExp(`\\${punctuation}`, 'g')
      const count = (textWithoutEllipsis.match(regex) || []).length
      totalPause += count * pause
    }
  }

  return totalPause
}

/**
 * Check if a line is a stage direction (NARRATOR or similar)
 */
function isStageDirection(speaker: string): boolean {
  const stageDirectionSpeakers = ['NARRATOR', 'STAGE DIRECTION', 'ACTION', 'DIRECTION']
  return stageDirectionSpeakers.includes(speaker.toUpperCase())
}

/**
 * Calculate the display time for a script line in milliseconds
 *
 * Factors:
 * - Base time from word count (using WPM)
 * - Additional time for punctuation pauses
 * - Mood multiplier (angry = faster, whispering = slower)
 * - Special handling for stage directions
 * - Clamped to min/max bounds
 */
export function calculateLineDisplayTime(line: ScriptLine): number {
  const { speaker, text, mood } = line

  // Special handling for stage directions
  if (isStageDirection(speaker)) {
    // Stage directions get base time plus word count
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const wordTime = (wordCount / WORDS_PER_MINUTE) * 60 * 1000
    return Math.min(
      Math.max(STAGE_DIRECTION_BASE_TIME + wordTime * 0.5, MIN_LINE_DISPLAY_TIME),
      MAX_LINE_DISPLAY_TIME
    )
  }

  // Count words (filter out empty strings from multiple spaces)
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length

  // Base reading time from words per minute
  const baseTimeMs = (wordCount / WORDS_PER_MINUTE) * 60 * 1000

  // Add punctuation pauses
  const punctuationPause = calculatePunctuationPauses(text)

  // Apply mood multiplier
  const moodMultiplier = MOOD_TIMING_MULTIPLIERS[mood] || MOOD_TIMING_MULTIPLIERS.neutral

  // Calculate total time
  const totalTime = (baseTimeMs + punctuationPause) * moodMultiplier

  // Clamp to bounds
  return Math.min(Math.max(totalTime, MIN_LINE_DISPLAY_TIME), MAX_LINE_DISPLAY_TIME)
}
