import type { ScriptLine, TeleprompterSettings } from '@/lib/types'

export interface MoodIndicator {
  emoji: string
  color: string
  label: string
}

const moodMap: Record<string, MoodIndicator> = {
  angry: { emoji: '', color: '#D77A7A', label: 'Angry' },
  happy: { emoji: '', color: '#82B682', label: 'Happy' },
  confused: { emoji: '', color: '#E8A75D', label: 'Confused' },
  whispering: { emoji: '', color: '#7C9FD9', label: 'Whispering' },
  neutral: { emoji: '', color: '#9B9590', label: 'Neutral' }
}

/**
 * Get mood emoji and color for a given mood string.
 * Uses hex values because colors are used with alpha suffixes (e.g., ${color}20)
 */
export function getMoodIndicator(mood: string): MoodIndicator {
  return moodMap[mood] || moodMap.neutral
}

/**
 * Get visible lines based on teleprompter settings (past/upcoming line visibility).
 */
export function getVisibleLines(
  lines: ScriptLine[],
  currentIndex: number,
  settings: TeleprompterSettings
): { line: ScriptLine; originalIndex: number }[] {
  const result: { line: ScriptLine; originalIndex: number }[] = []

  // Calculate start index (past lines)
  let startIndex: number
  if (settings.pastLinesVisible === 'all') {
    startIndex = 0
  } else {
    startIndex = Math.max(0, currentIndex - settings.pastLinesVisible)
  }

  // Calculate end index (upcoming lines)
  let endIndex: number
  if (settings.upcomingLinesVisible === 'all') {
    endIndex = lines.length - 1
  } else {
    endIndex = Math.min(lines.length - 1, currentIndex + settings.upcomingLinesVisible)
  }

  for (let i = startIndex; i <= endIndex; i++) {
    result.push({ line: lines[i], originalIndex: i })
  }

  return result
}
