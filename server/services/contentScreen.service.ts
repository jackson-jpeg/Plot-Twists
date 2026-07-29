/**
 * IP layer 3 — output screening.
 *
 * Layers 1 and 2 control what goes IN: an archetype catalog, and a submit path
 * that only accepts IDs from it. Neither constrains what the model hands back.
 * Ask Claude for "a wheezing space tyrant with unresolved family issues" and it
 * may well write DARTH VADER into the dialogue unprompted, because that is what
 * its training data says the answer is.
 *
 * This runs on the finished script, before `script_ready` is emitted.
 *
 * ── What it does on a hit ────────────────────────────────────────────────────
 * REDACTS in prose (title, synopsis, line text) and LOGS. It does not block.
 *
 * Not blocking is a deliberate call. A blocked generation means a room full of
 * people staring at a spinner, and the failure path for that is already broken
 * (D5/D6 — an AI failure currently strands the room in LOADING silently). A
 * false positive must never be able to end a party.
 *
 * Speakers are logged but NOT rewritten: `speaker` is joined to
 * `player.assignedCharacter` for voting and gameHistory, so rewriting it would
 * silently detach a player from their own lines. A named speaker is a louder
 * signal than a named noun in dialogue and is worth a human look, which is what
 * the log is for.
 *
 * ── The audit trail ─────────────────────────────────────────────────────────
 * Every screened generation is logged with room code and timestamp, so that a
 * complaint six months from now can be answered with "here is what we generated
 * and here is what we removed" rather than a shrug.
 */

import { PROTECTED_TERMS, REAL_PEOPLE } from '@/lib/protectedTerms'
import type { Script } from '@/lib/types'
import { logger } from '@/lib/logger'

export type ScreenCategory = 'franchise' | 'real-person'

export interface ScreenHit {
  term: string
  category: ScreenCategory
  /** 'title' | 'synopsis' | 'line:<n>' | 'speaker:<n>' */
  where: string
}

export interface ScreenResult {
  script: Script
  hits: ScreenHit[]
  /** True when anything was rewritten (speaker-only hits do not count). */
  redacted: boolean
}

/** What a redacted franchise name is replaced with, in prose. */
const REDACTION = 'someone you would recognise'

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Word-boundary, case-insensitive matchers, built once at module load.
 *
 * `\b` is wrong at the edges for terms like "WALL-E" and "Mr. Bean" — a
 * trailing `.` or `-` is not a word character, so `\b` there never matches.
 * Boundaries are asserted with explicit lookarounds on letters/digits instead.
 */
function buildMatcher(term: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, 'gi')
}

/**
 * A term can legitimately be in both lists — "Jerry Seinfeld" was a catalog
 * character AND is a living person. `real-person` wins: right of publicity is
 * the stronger and less forgiving claim, and a report that files him under
 * `franchise` would understate the exposure.
 */
const REAL_PEOPLE_LOWER = new Set(REAL_PEOPLE.map((term) => term.toLowerCase()))

const MATCHERS: Array<{ term: string; category: ScreenCategory; re: RegExp }> = [
  ...REAL_PEOPLE.map((term) => ({ term, category: 'real-person' as const, re: buildMatcher(term) })),
  ...PROTECTED_TERMS
    .filter((term) => !REAL_PEOPLE_LOWER.has(term.toLowerCase()))
    .map((term) => ({ term, category: 'franchise' as const, re: buildMatcher(term) })),
  // Longest first, so "Sherlock Holmes" is consumed before a shorter overlap.
].sort((a, b) => b.term.length - a.term.length)

/** Find hits in a string without modifying it. */
function findHits(text: string, where: string, into: ScreenHit[]): void {
  if (!text) return
  for (const { term, category, re } of MATCHERS) {
    re.lastIndex = 0
    if (re.test(text)) into.push({ term, category, where })
  }
}

/** Find hits AND return the text with them replaced. */
function redact(text: string, where: string, into: ScreenHit[]): string {
  if (!text) return text
  let out = text
  for (const { term, category, re } of MATCHERS) {
    re.lastIndex = 0
    if (!re.test(out)) continue
    into.push({ term, category, where })
    re.lastIndex = 0
    out = out.replace(re, REDACTION)
  }
  return out
}

/**
 * Screen a generated script. Returns a possibly-rewritten copy plus the hits.
 *
 * Pure: never mutates the script it is given, so a caller that ignores the
 * result still emits exactly what the model produced (and the log still shows
 * what was in it).
 */
export function screenScript(script: Script, roomCode: string): ScreenResult {
  const hits: ScreenHit[] = []

  const title = redact(script.title, 'title', hits)
  const synopsis = redact(script.synopsis, 'synopsis', hits)

  const lines = script.lines.map((line, index) => {
    const text = redact(line.text, `line:${index}`, hits)
    // Speaker: detect only. Rewriting it would break the speaker →
    // assignedCharacter join that voting and gameHistory depend on.
    findHits(line.speaker, `speaker:${index}`, hits)
    return text === line.text ? line : { ...line, text }
  })

  const redacted =
    title !== script.title ||
    synopsis !== script.synopsis ||
    lines.some((line, index) => line !== script.lines[index])

  if (hits.length > 0) {
    const terms = [...new Set(hits.map((hit) => hit.term))]
    const speakerHits = hits.filter((hit) => hit.where.startsWith('speaker:'))
    logger.warn(
      `[IP-SCREEN] room=${roomCode} at=${new Date().toISOString()} ` +
      `hits=${hits.length} terms=${JSON.stringify(terms)} ` +
      `redacted=${redacted} speakerHits=${speakerHits.length} ` +
      `title=${JSON.stringify(script.title)}`
    )
  }

  return { script: redacted ? { ...script, title, synopsis, lines } : script, hits, redacted }
}
