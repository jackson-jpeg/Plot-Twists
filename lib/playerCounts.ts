// Seat-count labels, derived — never restated.
//
// WHY THIS FILE EXISTS. The seat cap was 6 while three separate pieces of UI copy said otherwise:
// the host lobby rendered "Max 8" directly above a mode card reading "3-6 performers", and the
// marketing OG card advertised "1-6 Players". All three were hand-typed literals, so each drifted
// independently and the deployed site contradicted itself on a single screen. Every count that
// reaches a human now comes through here, and the unit tests assert that no literal has crept back.
//
// Client-safe: server/utils/constants.ts is pure data with no imports, so pulling it into the
// browser bundle costs nothing and keeps the cap a single definition rather than a copy the
// frontend has to remember to update.

import { MAX_PLAYERS, MIN_PLAYERS } from '@/server/utils/constants'
import type { GameMode } from '@/lib/types'

export { MAX_PLAYERS, MIN_PLAYERS }

export function seatRange(mode: GameMode): { min: number; max: number } {
  return { min: MIN_PLAYERS[mode], max: MAX_PLAYERS[mode] }
}

/** "1" for a fixed-size mode, "3-8" for a range. */
export function seatRangeLabel(mode: GameMode): string {
  const { min, max } = seatRange(mode)
  return min === max ? `${min}` : `${min}-${max}`
}

/** The cast-size line on a mode card: "2 performers", "3-8 performers". */
export function performersLabel(mode: GameMode): string {
  const { min, max } = seatRange(mode)
  const noun = max === 1 ? 'player' : 'performers'
  return `${seatRangeLabel(mode)} ${noun}`
}

/** Widest supported party, across every mode — for marketing surfaces. "1-8". */
export const ALL_MODES_PLAYER_RANGE_LABEL: string = (() => {
  const modes = Object.keys(MAX_PLAYERS) as GameMode[]
  const min = Math.min(...modes.map(m => MIN_PLAYERS[m]))
  const max = Math.max(...modes.map(m => MAX_PLAYERS[m]))
  return `${min}-${max}`
})()

/**
 * Fallback seat count for a room whose live preview could not be fetched — the invite link's OG
 * card renders before the socket answers. The largest mode is the right guess: it is the only one
 * that cannot under-report and tell a sharer their room is fuller than it is.
 */
export const FALLBACK_MAX_PLAYERS: number = Math.max(...Object.values(MAX_PLAYERS))
