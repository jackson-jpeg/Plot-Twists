/**
 * Short speaker labels.
 *
 * The property that matters here is NOT that the labels are pretty. It is that shortening stayed a
 * rendering concern: the full trait string is what binds a written part to a person in the room
 * (`MobileTeleprompter`'s `isMyTurn`), and a label that collides with another label tells the WRONG
 * player it is their turn to read. That is a worse bug than the wrapping this replaced, so the
 * uniqueness tests below are the load-bearing ones.
 *
 * The last describe block reads component source as TEXT, because the separation between "display"
 * and "identity" cannot be observed at runtime — a future edit that swaps `labelFor(...)` into the
 * `===` would pass every behavioural test in this file.
 */

import fs from 'fs'
import path from 'path'
import {
  buildSpeakerLabels,
  shortSpeakerLabel,
  isStageDirectionSpeaker,
  STAGE_DIRECTION_SPEAKERS,
} from '@/lib/speakerLabel'

/** A real 8-trait cast, copied from a live generation in `.real-generation.json`. */
const REAL_CAST = [
  'Was promoted last week and has not recovered',
  'Asks how much everything cost',
  'Times things nobody asked to be timed',
  'Reads every sign aloud',
  'Would like to make one small point, at length',
  'Has one anecdote and it does not fit here',
  'Speaks entirely in questions when nervous',
  'Suggests a group photograph at every escalation',
]

describe('buildSpeakerLabels', () => {
  const labels = buildSpeakerLabels(REAL_CAST)

  it('returns a label for every cast member', () => {
    expect(labels.size).toBe(REAL_CAST.length)
    for (const trait of REAL_CAST) expect(labels.get(trait)).toBeTruthy()
  })

  it('is keyed by the original string, so callers never normalise anything themselves', () => {
    for (const trait of REAL_CAST) expect(labels.has(trait)).toBe(true)
  })

  it('actually shortens — every label is shorter than the trait it stands for', () => {
    for (const trait of REAL_CAST) {
      expect(labels.get(trait)!.length).toBeLessThan(trait.length)
    }
  })

  it('keeps every label short enough to sit on one line at 13px', () => {
    // 28 characters is the measured budget for the teleprompter cue card at its narrowest
    // (390px viewport, 24px padding, 13px mono, 0.12em tracking). The whole point of the change.
    for (const trait of REAL_CAST) {
      expect(labels.get(trait)!.length).toBeLessThanOrEqual(28)
    }
  })

  it('produces a distinct label for every distinct trait', () => {
    const seen = new Set([...labels.values()])
    expect(seen.size).toBe(REAL_CAST.length)
  })

  it('starts at the beginning of the trait, so a player can match it to the card in their hand', () => {
    for (const trait of REAL_CAST) {
      const label = labels.get(trait)!.replace(/…$/, '')
      expect(trait.toLowerCase().startsWith(label.toLowerCase())).toBe(true)
    }
  })

  it('marks truncation, so a short label does not read as the whole card', () => {
    expect(labels.get('Was promoted last week and has not recovered')).toMatch(/…$/)
  })
})

describe('collisions — the case that would tell the wrong player to read', () => {
  it('grows past a shared opening rather than emitting the same label twice', () => {
    const cast = [
      'Explains the joke immediately after telling it',
      'Explains the joke and then repeats it',
    ]
    const labels = buildSpeakerLabels(cast)

    // Both traits share "Explains the joke" (17 chars), which clears the readability floor on its
    // own. Without the growth loop both would render identically.
    expect(labels.get(cast[0])).not.toBe(labels.get(cast[1]))
    expect(labels.get(cast[0])).toContain('immediately')
    expect(labels.get(cast[1])).toContain('and')
  })

  it('grows only the labels that collide, leaving the rest short', () => {
    const cast = [
      'Explains the joke immediately after telling it',
      'Explains the joke and then repeats it',
      'Reads every sign aloud',
    ]
    const labels = buildSpeakerLabels(cast)
    expect(labels.get('Reads every sign aloud')).toBe('Reads every sign…')
  })

  it('terminates when two traits cannot be separated at all', () => {
    // Same words after the `asPerformer` wrapper is stripped. There is no prefix that separates
    // these, so the loop must stop rather than grow forever. A hang here is a frozen teleprompter.
    const cast = ['Reads every sign aloud', 'Someone who reads every sign aloud']
    const labels = buildSpeakerLabels(cast)
    expect(labels.size).toBe(2)
    for (const trait of cast) expect(labels.get(trait)).toBeTruthy()
  })

  it('handles a trait that is a strict prefix of another', () => {
    const cast = ['Reads every sign', 'Reads every sign aloud, twice']
    const labels = buildSpeakerLabels(cast)
    expect(labels.get(cast[0])).not.toBe(labels.get(cast[1]))
  })

  it('is stable — the same cast always yields the same labels', () => {
    expect([...buildSpeakerLabels(REAL_CAST).values()])
      .toEqual([...buildSpeakerLabels(REAL_CAST).values()])
  })

  it('does not depend on cast order', () => {
    const forwards = buildSpeakerLabels(REAL_CAST)
    const backwards = buildSpeakerLabels([...REAL_CAST].reverse())
    for (const trait of REAL_CAST) expect(backwards.get(trait)).toBe(forwards.get(trait))
  })
})

describe('edge cases', () => {
  it('leaves stage directions exactly as written', () => {
    const cast = [...STAGE_DIRECTION_SPEAKERS, 'Reads every sign aloud']
    const labels = buildSpeakerLabels(cast)
    for (const speaker of STAGE_DIRECTION_SPEAKERS) {
      expect(labels.get(speaker)).toBe(speaker)
    }
  })

  it('agrees with the server-side binder about what is a person', () => {
    // scriptCast.service re-exports this exact function. If they ever disagree, the binder reports
    // a stage direction as a seated player with no lines.
    expect(isStageDirectionSpeaker('narrator')).toBe(true)
    expect(isStageDirectionSpeaker('  Stage Direction  ')).toBe(true)
    expect(isStageDirectionSpeaker('Reads every sign aloud')).toBe(false)
  })

  it('strips the asPerformer wrapper if the model glues it back on', () => {
    const label = shortSpeakerLabel('Someone who reads every sign aloud', [
      'Someone who reads every sign aloud',
    ])
    expect(label.toLowerCase().startsWith('someone')).toBe(false)
    expect(label).toContain('Reads')
  })

  it('leaves a name-length speaker alone', () => {
    expect(shortSpeakerLabel('MARCUS', ['MARCUS', 'DENISE'])).toBe('MARCUS')
  })

  it('returns the input unchanged for a speaker that is not in the cast', () => {
    expect(shortSpeakerLabel('Someone Else Entirely', REAL_CAST)).toBe('Someone Else Entirely')
  })

  it('survives an empty cast and an empty speaker', () => {
    expect(buildSpeakerLabels([]).size).toBe(0)
    expect(() => buildSpeakerLabels([''])).not.toThrow()
  })
})

describe('shortening is a rendering concern and must stay one', () => {
  const read = (relative: string) =>
    fs.readFileSync(path.join(process.cwd(), relative), 'utf8')

  it('MobileTeleprompter decides whose turn it is with the FULL speaker string', () => {
    const source = read('components/MobileTeleprompter.tsx')
    expect(source).toContain('currentLine.speaker === myCharacter')
    expect(source).not.toMatch(/labelFor\([^)]*\)\s*===/)
  })

  it('the exported script keeps the full trait, because it is the archival copy', () => {
    const source = read('lib/scriptUtils.ts')
    expect(source).toContain('line.speaker.toUpperCase()')
    expect(source).not.toContain('speakerLabel')
  })

  it('the clip and digest attribution keep the full trait', () => {
    expect(read('app/clips/page.tsx')).toContain('l.speaker === winnerCharacter')
    expect(read('app/digest/page.tsx')).toContain('l.speaker === playerEntry.character')
  })

  it('every display site that shortens also exposes the full trait to assistive tech', () => {
    for (const file of [
      'components/MobileTeleprompter.tsx',
      'app/host/components/HostPerforming.tsx',
      'app/replay/[code]/page.tsx',
    ]) {
      const source = read(file)
      const shortened = (source.match(/\{labelFor\(/g) ?? []).length
      const labelled = (source.match(/aria-label=\{[^}]*speaker\}/g) ?? []).length
      expect(shortened).toBeGreaterThan(0)
      // The cast list under the host title is a summary, not a line attribution, so it is allowed
      // to shorten without an aria-label of its own.
      expect(labelled).toBeGreaterThanOrEqual(shortened - 1)
    }
  })
})
