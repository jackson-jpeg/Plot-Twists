/**
 * Cast binding for generated scripts.
 *
 * WHY THIS EXISTS, AND IT IS NOT A TIDY-UP.
 *
 * `ScriptLine.speaker` is not decoration. `components/MobileTeleprompter.tsx` decides whose phone
 * says YOUR TURN with `currentLine.speaker === myCharacter`, and `myCharacter` is set in
 * `stores/subscriptions.ts` to `selection.character.name` — the VERBATIM TEXT OF THE TRAIT CARD
 * the player picked ("Insists nothing is wrong at increasing volume"). That comparison is the only
 * thing in the product that binds a written part to a person in the room.
 *
 * Until 2026-07-30 it could never be true. The prompt handed the model a list of traits and an
 * output format whose example read `"speaker": "Character Name"`, so the model did the sensible
 * thing and invented first names. Measured across the three live 8-player generations in
 * `.real-generation.json`: speakers were Marcus / Denise / Paulo / Jen / ... and **zero of eight
 * traits matched in any of the three scripts**. Every part in every script belonged to nobody, and
 * YOUR TURN had never fired for any player since the teleprompter was written.
 *
 * The prompt now demands the trait strings verbatim (see `comedyPrompts.ts`). A prompt is not a
 * guarantee, so this module is the enforcement and the instrument:
 *
 *   - It SNAPS near-misses back onto the cast. A trailing full stop, a capitalisation change or a
 *     "Someone who ..." rewrap are all things a model does casually and all things that break an
 *     `===`. Snapping is what makes the binding robust rather than lucky.
 *   - It REPORTS what it could not snap, per generation, at warn level. Off-cast speakers, silent
 *     cast members and the per-speaker line distribution all become log lines, which is the
 *     difference between "the model usually complies" and knowing.
 *
 * IT DOES NOT REWRITE ORPHANS ONTO REAL PLAYERS. Reassigning an invented character's dialogue to
 * a seated player would make the scene incoherent — the lines were written for someone else — and
 * would hide the failure it is meant to expose. Orphans stay orphaned and get logged loudly.
 */

import type { Script } from '../../lib/types'
import { logger } from '../../lib/logger'

/** Speakers that are narration rather than a person, and so are never expected on the cast list. */
const STAGE_DIRECTION_SPEAKERS = ['NARRATOR', 'STAGE DIRECTION', 'ACTION', 'DIRECTION']

export function isStageDirectionSpeaker(speaker: string): boolean {
  return STAGE_DIRECTION_SPEAKERS.includes(speaker.trim().toUpperCase())
}

/**
 * Collapse a speaker label to a comparison key.
 *
 * Deliberately aggressive: everything it discards is something a model varies without meaning to,
 * and nothing it discards can distinguish two different trait cards. `someone who ` is stripped
 * because that is the exact wrapper `asPerformer()` puts in front of every trait in the prompt, so
 * it is the single most likely thing to come back glued to the front of a speaker name.
 */
function castKey(speaker: string): string {
  return speaker
    .toLowerCase()
    .replace(/^\s*someone\s+who\s+/, '')
    .replace(/[^a-z0-9]+/g, '')
}

export interface CastBinding {
  /** Lines whose speaker was corrected onto an exact cast string. */
  snapped: number
  /** Distinct speaker labels that matched no cast member and are not stage directions. */
  offCast: string[]
  /** Cast members with no lines at all. */
  silent: string[]
  /** Lines per cast member, cast order preserved. Excludes off-cast and stage directions. */
  lineCounts: Array<{ character: string; lines: number }>
  /** Cast members below the 3-line floor the prompt asks for. */
  belowFloor: Array<{ character: string; lines: number }>
}

/** The per-character floor the ENSEMBLE prompt promises. Jackson's ruling, 2026-07-30. */
export const MIN_LINES_PER_CHARACTER = 3

/**
 * Snap every speaker onto the seated cast where possible, and report what happened.
 *
 * MUTATES `script.lines[].speaker` in place for snapped lines — the corrected script is what the
 * room performs, and returning a copy would leave the caller free to perform the broken one.
 *
 * `cast` is the list of trait strings that were sent to the model. For SOLO that is the single
 * human player: the AI ensemble is invented ON PURPOSE there, so its names land in `offCast` and
 * the caller is expected not to treat that as a defect.
 */
export function bindCastToScript(script: Script, cast: string[]): CastBinding {
  const byKey = new Map<string, string>()
  for (const character of cast) byKey.set(castKey(character), character)

  const counts = new Map<string, number>(cast.map(c => [c, 0]))
  const offCast: string[] = []
  let snapped = 0

  for (const line of script.lines) {
    if (isStageDirectionSpeaker(line.speaker)) continue

    const match = byKey.get(castKey(line.speaker))
    if (match) {
      if (line.speaker !== match) {
        line.speaker = match
        snapped++
      }
      counts.set(match, (counts.get(match) ?? 0) + 1)
    } else if (!offCast.includes(line.speaker)) {
      offCast.push(line.speaker)
    }
  }

  const lineCounts = cast.map(character => ({ character, lines: counts.get(character) ?? 0 }))

  return {
    snapped,
    offCast,
    silent: lineCounts.filter(c => c.lines === 0).map(c => c.character),
    lineCounts,
    belowFloor: lineCounts.filter(c => c.lines > 0 && c.lines < MIN_LINES_PER_CHARACTER),
  }
}

/**
 * Log a binding result at the right volume for the mode.
 *
 * SOLO is the one mode where off-cast speakers are correct, so it is logged as information rather
 * than as a fault. Everywhere else an off-cast speaker is a part nobody in the room can read, and
 * that is a warn — the whole reason the instrument exists is that this failure is invisible from
 * inside the game.
 */
export function logCastBinding(
  binding: CastBinding,
  gameMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE',
  castSize: number,
): void {
  const distribution = binding.lineCounts.map(c => c.lines).join('/')
  logger.info(
    `Cast binding (${gameMode}): ${castSize} seated, lines per player ${distribution}` +
      (binding.snapped > 0 ? `, ${binding.snapped} speaker label(s) snapped onto the cast` : ''),
  )

  if (binding.offCast.length > 0) {
    if (gameMode === 'SOLO') {
      logger.debug(`SOLO AI ensemble (invented by design): ${binding.offCast.join(', ')}`)
    } else {
      logger.warn(
        `Script contains ${binding.offCast.length} speaker(s) who are not seated players and ` +
          `whose lines nobody in the room will be told to read: ${binding.offCast.join(', ')}. ` +
          `The prompt forbids this — see comedyPrompts.ts RULE 1.`,
      )
    }
  }

  if (binding.silent.length > 0) {
    logger.warn(
      `${binding.silent.length} seated player(s) got no lines at all: ${binding.silent.join(', ')}`,
    )
  }

  if (binding.belowFloor.length > 0) {
    logger.warn(
      `${binding.belowFloor.length} seated player(s) below the ${MIN_LINES_PER_CHARACTER}-line ` +
        `floor: ${binding.belowFloor.map(c => `${c.character} (${c.lines})`).join(', ')}`,
    )
  }
}
