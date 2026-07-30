/**
 * Cast binding — the thing that decides whether a written part belongs to a person in the room.
 *
 * The bug these tests exist to keep dead: `MobileTeleprompter` fires YOUR TURN on
 * `line.speaker === myCharacter`, `myCharacter` is the verbatim trait card, and the model was
 * returning invented first names — so the comparison was false for every line ever generated.
 * Measured 2026-07-30: zero of eight traits matched in any of three live scripts.
 */

import {
  bindCastToScript,
  isStageDirectionSpeaker,
  MIN_LINES_PER_CHARACTER,
} from '@/server/services/scriptCast.service'
import type { Script } from '@/lib/types'

const CAST = [
  'Is doing an impression of somebody in the room',
  'Has already named the children',
  'Treats every conversation as a negotiation',
]

function scriptOf(speakers: string[]): Script {
  return {
    title: 'T',
    synopsis: 'S',
    lines: speakers.map(speaker => ({ speaker, text: 'x', mood: 'neutral' })),
  } as Script
}

describe('bindCastToScript', () => {
  it('leaves an already-verbatim cast untouched', () => {
    const script = scriptOf([CAST[0], CAST[1], CAST[2], CAST[0]])
    const b = bindCastToScript(script, CAST)

    expect(b.snapped).toBe(0)
    expect(b.offCast).toEqual([])
    expect(b.silent).toEqual([])
    expect(script.lines.map(l => l.speaker)).toEqual([CAST[0], CAST[1], CAST[2], CAST[0]])
  })

  it('counts lines per cast member in cast order', () => {
    const script = scriptOf([CAST[0], CAST[0], CAST[1], CAST[0]])
    const b = bindCastToScript(script, CAST)

    expect(b.lineCounts).toEqual([
      { character: CAST[0], lines: 3 },
      { character: CAST[1], lines: 1 },
      { character: CAST[2], lines: 0 },
    ])
  })

  // Each of these is a real thing a model does casually, and each one breaks a raw `===`.
  it.each([
    ['trailing punctuation', `${CAST[0]}.`],
    ['upper case', CAST[0].toUpperCase()],
    ['the asPerformer wrapper glued back on', `Someone who ${CAST[0].toLowerCase()}`],
    ['extra whitespace', `  ${CAST[0]}  `],
    ['doubled internal spaces', CAST[0].replace(/ /g, '  ')],
  ])('snaps a speaker that differs only by %s', (_label, variant) => {
    const script = scriptOf([variant, CAST[1], CAST[2]])
    const b = bindCastToScript(script, CAST)

    expect(b.snapped).toBe(1)
    expect(b.offCast).toEqual([])
    // The point of snapping: the string the teleprompter compares is now the exact card text.
    expect(script.lines[0].speaker).toBe(CAST[0])
  })

  it('reports an invented character rather than silently rewriting it onto a real player', () => {
    const script = scriptOf([CAST[0], CAST[1], CAST[2], 'Reginald', 'Reginald'])
    const b = bindCastToScript(script, CAST)

    expect(b.offCast).toEqual(['Reginald'])
    // Reginald's lines stay Reginald's. Reassigning them would make the scene incoherent and
    // would hide exactly the failure this is here to surface.
    expect(script.lines[3].speaker).toBe('Reginald')
    expect(b.lineCounts.reduce((s, c) => s + c.lines, 0)).toBe(3)
  })

  it('does not count invented characters toward anybody, so a silent player stays visible', () => {
    const script = scriptOf(['Marcus', 'Denise', 'Paulo'])
    const b = bindCastToScript(script, CAST)

    expect(b.offCast).toEqual(['Marcus', 'Denise', 'Paulo'])
    expect(b.silent).toEqual(CAST)
  })

  it('reproduces the shipped bug: invented first names bind to nobody', () => {
    // Verbatim from .real-generation.json, script 1, before the prompt change.
    const script = scriptOf(['Marcus', 'Denise', 'New Riley', 'Paulo', 'Jen'])
    const b = bindCastToScript(script, CAST)

    expect(b.lineCounts.every(c => c.lines === 0)).toBe(true)
    expect(b.offCast).toHaveLength(5)
  })

  it('flags cast members under the line floor, but not ones with no lines at all', () => {
    // `silent` and `belowFloor` are deliberately disjoint — a player with zero lines is a
    // different failure from one with two, and collapsing them would blur the report.
    const script = scriptOf([CAST[0], CAST[0], CAST[0], CAST[1], CAST[1]])
    const b = bindCastToScript(script, CAST)

    expect(b.belowFloor).toEqual([{ character: CAST[1], lines: 2 }])
    expect(b.silent).toEqual([CAST[2]])
  })

  it('holds the floor at 3, which is the number the prompt promises', () => {
    expect(MIN_LINES_PER_CHARACTER).toBe(3)

    const atFloor = scriptOf([CAST[0], CAST[0], CAST[0]])
    expect(bindCastToScript(atFloor, [CAST[0]]).belowFloor).toEqual([])

    const under = scriptOf([CAST[0], CAST[0]])
    expect(bindCastToScript(under, [CAST[0]]).belowFloor).toEqual([{ character: CAST[0], lines: 2 }])
  })

  it('ignores stage directions instead of reporting them as invented characters', () => {
    const script = scriptOf(['NARRATOR', CAST[0], 'Stage Direction', CAST[1], CAST[2]])
    const b = bindCastToScript(script, CAST)

    expect(b.offCast).toEqual([])
    expect(script.lines[0].speaker).toBe('NARRATOR')
  })

  it('treats the SOLO shape as bindable for the human and free for the invented ensemble', () => {
    const script = scriptOf([CAST[0], 'A Bored Sentry', CAST[0], 'A Health And Safety Inspector'])
    const b = bindCastToScript(script, [CAST[0]])

    expect(b.lineCounts).toEqual([{ character: CAST[0], lines: 2 }])
    expect(b.offCast).toEqual(['A Bored Sentry', 'A Health And Safety Inspector'])
    expect(b.silent).toEqual([])
  })

  it('does not mistake two different cast members for each other', () => {
    // The key collapses punctuation and case. It must not collapse anything that distinguishes
    // two real cards, or one player would be told to read another player's lines.
    const near = ['Says "no offence" and then takes some', 'Says no offence and then takes some!']
    const script = scriptOf([near[0], near[1]])
    const b = bindCastToScript(script, [near[0]])

    // Both collapse to the same key — which is correct here, they ARE the same card respelled.
    expect(b.lineCounts[0].lines).toBe(2)

    const distinct = ['Has already named the children', 'Has already named the child']
    const s2 = scriptOf([distinct[1]])
    expect(bindCastToScript(s2, [distinct[0]]).offCast).toEqual([distinct[1]])
  })
})

describe('isStageDirectionSpeaker', () => {
  it.each(['NARRATOR', 'narrator', 'Stage Direction', ' ACTION ', 'DIRECTION'])(
    'recognises %s',
    speaker => expect(isStageDirectionSpeaker(speaker)).toBe(true),
  )

  it('does not treat a trait card as narration', () => {
    expect(isStageDirectionSpeaker(CAST[0])).toBe(false)
  })
})
