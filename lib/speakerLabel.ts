/**
 * Short display labels for speaker names.
 *
 * WHAT THIS IS FOR, AND WHAT IT MUST NEVER DO.
 *
 * Since 2026-07-30 a script's `speaker` field IS the trait card the player picked, verbatim
 * ("Insists nothing is wrong at increasing volume"). That is deliberate and it is the only thing
 * binding a written part to a person in the room — `MobileTeleprompter` decides whose phone says
 * YOUR TURN with `currentLine.speaker === myCharacter`. See `server/services/scriptCast.service.ts`
 * for why that binding did not exist before.
 *
 * The cost is cosmetic and real: a 45-character sentence set at 13px uppercase mono wraps to two
 * or three lines above every single line of dialogue. This shortens what is DISPLAYED.
 *
 * THE RULE, AND IT IS THE WHOLE DESIGN: shortening is a rendering concern. Identity is not.
 *   - Display sites call this.
 *   - Every `===` that decides who someone is keeps the full string (`MobileTeleprompter`'s
 *     `isMyTurn`, `app/clips`, `app/digest`).
 *   - `lib/scriptUtils.formatScriptAsText` keeps the full string — that is the archival copy a
 *     player shares, and a truncated one is a worse artefact.
 * `__tests__/unit/lib/speakerLabel.test.ts` asserts that separation by reading the source, because
 * no runtime check can see a future edit that swaps one for the other.
 *
 * WHY A PREFIX AND NOT A CLEVERER SUMMARY. The player is holding the card. A prefix is something
 * they can match against what is in their hand; an extracted noun phrase ("A NEGOTIATION") is not.
 * Prefixes are also deterministic, which is what lets the uniqueness guarantee below hold.
 */

/** Speakers that are narration rather than a person. Shared with the server-side cast binder. */
export const STAGE_DIRECTION_SPEAKERS = ['NARRATOR', 'STAGE DIRECTION', 'ACTION', 'DIRECTION']

export function isStageDirectionSpeaker(speaker: string): boolean {
  return STAGE_DIRECTION_SPEAKERS.includes(speaker.trim().toUpperCase())
}

/**
 * Grow the label until it reaches this many characters before considering it readable.
 *
 * Chosen against the real 8-trait casts in `.real-generation.json` rather than by taste: below 14
 * the deck produces labels that are pure auxiliary verbs ("Has already", "Will not"), which name
 * nothing. Above ~18 the labels start wrapping again at 13px, which is the problem being fixed.
 */
const MIN_LABEL_CHARS = 14

/** The wrapper `asPerformer()` puts in front of every trait, if it comes back glued on. */
const LEADING_WRAPPER = /^\s*someone\s+who\s+/i

const ELLIPSIS = '…'

function labelWords(speaker: string): string[] {
  const stripped = speaker.replace(LEADING_WRAPPER, '')
  // Traits are written to follow "Someone who …", so they start lower case. Stripping the wrapper
  // leaves "reads every sign aloud", which is fine where CSS uppercases the label (teleprompter,
  // host screen) and looks like a bug on the replay view, which does not. Only touched when the
  // wrapper was actually removed — an all-caps speaker like MARCUS must survive untouched.
  const cased =
    stripped === speaker ? stripped : stripped.charAt(0).toUpperCase() + stripped.slice(1)
  return cased.trim().split(/\s+/).filter(Boolean)
}

function render(words: string[], take: number): string {
  const label = words.slice(0, take).join(' ')
  return take < words.length ? `${label}${ELLIPSIS}` : label
}

/**
 * Build a display label for every speaker in a cast, guaranteed distinct within that cast.
 *
 * Two traits that share an opening ("Has already searched your bag" / "Has already named the
 * children" are both in the live deck) would otherwise collapse to the same label, which is worse
 * than the long form: it tells the wrong player it is their turn to read. Colliding labels grow a
 * word at a time until they separate, so uniqueness beats brevity whenever they conflict.
 *
 * Returns a Map keyed by the ORIGINAL string, so callers look up with the value they already hold
 * and never have to reproduce the normalisation.
 */
export function buildSpeakerLabels(cast: string[]): Map<string, string> {
  const unique = [...new Set(cast)]
  const entries = unique.map(full => {
    const words = labelWords(full)
    let take = 1
    while (take < words.length && words.slice(0, take).join(' ').length < MIN_LABEL_CHARS) take++
    return { full, words, take, stageDirection: isStageDirectionSpeaker(full) }
  })

  // Grow colliding labels a word at a time. Bounded by the longest trait in the cast, and each
  // pass either separates a group or exhausts its members' words, so it always terminates.
  for (;;) {
    const groups = new Map<string, typeof entries>()
    for (const entry of entries) {
      const key = entry.stageDirection ? entry.full : render(entry.words, entry.take).toLowerCase()
      const group = groups.get(key)
      if (group) group.push(entry)
      else groups.set(key, [entry])
    }

    let grew = false
    for (const group of groups.values()) {
      if (group.length < 2) continue
      for (const entry of group) {
        if (entry.take < entry.words.length) {
          entry.take++
          grew = true
        }
      }
    }
    if (!grew) break
  }

  return new Map(
    entries.map(entry => [
      entry.full,
      // Stage directions are not people and are already short. Left exactly as written.
      entry.stageDirection ? entry.full : render(entry.words, entry.take),
    ]),
  )
}

/**
 * Convenience for a single speaker. `cast` must be every speaker in the same script — passing a
 * partial cast silently gives up the uniqueness guarantee, which is the one property worth having.
 */
export function shortSpeakerLabel(speaker: string, cast: string[]): string {
  return buildSpeakerLabels(cast).get(speaker) ?? speaker
}
