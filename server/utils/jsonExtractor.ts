/**
 * JSON Extractor Utility
 * Extracts JSON objects from text using bracket-matching.
 * Handles markdown fences, preamble text, and nested brackets.
 */

/** Extract JSON object from text using bracket-matching (handles preamble, fences, trailing text) */
export function extractJSON(text: string): string {
  // Strip markdown fences
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  // Find first { or [
  const startBrace = cleaned.indexOf('{')
  const startBracket = cleaned.indexOf('[')
  let start = -1
  let openChar = '{'
  let closeChar = '}'

  if (startBrace === -1 && startBracket === -1) {
    return cleaned // fallback
  } else if (startBrace === -1) {
    start = startBracket; openChar = '['; closeChar = ']'
  } else if (startBracket === -1) {
    start = startBrace
  } else {
    start = Math.min(startBrace, startBracket)
    if (start === startBracket) { openChar = '['; closeChar = ']' }
  }

  // Track depth to find matching close
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"' && !escape) { inString = !inString; continue }
    if (inString) continue
    if (ch === openChar) depth++
    if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return cleaned.slice(start, i + 1)
      }
    }
  }

  // Fallback: return from start to end
  return cleaned.slice(start)
}
