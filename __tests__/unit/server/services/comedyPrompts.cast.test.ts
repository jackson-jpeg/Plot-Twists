/**
 * The cast instructions in the prompt.
 *
 * `bindCastToScript` can only snap a speaker onto a cast member the model was actually shown. If
 * the prompt ever stops carrying the trait strings VERBATIM — a rewrap, a truncation, a tidy-up
 * that lowercases them — the binding silently reverts to what it was before 2026-07-30: every
 * part belonging to nobody, with no error anywhere. These assert the prompt's half of the
 * contract, which is the half no runtime check can see.
 */

import { getModeInstructions } from '@/server/services/prompts/comedyPrompts'
import { MIN_LINES_PER_CHARACTER } from '@/server/services/scriptCast.service'

const TRAITS = [
  'Is doing an impression of somebody in the room',
  'Has already named the children',
  'Treats every conversation as a negotiation',
  'Says "no offence" and then takes some',
  'Explains why they are late for longer than they were late',
]

const SETTING = 'A Conference Room Booked For A Pointless Meeting'
const CIRCUMSTANCE = 'Somebody has to be told'

describe('ENSEMBLE cast instructions', () => {
  const prompt = getModeInstructions('ENSEMBLE', TRAITS, SETTING, CIRCUMSTANCE)

  it.each(TRAITS)('carries the trait verbatim so the model can copy it: %s', trait => {
    expect(prompt).toContain(trait)
  })

  it('states the line floor as the same number the binder measures against', () => {
    expect(prompt).toContain(`AT LEAST ${MIN_LINES_PER_CHARACTER} lines`)
  })

  it('forbids the next character by number, so the rule scales with the cast', () => {
    expect(prompt).toContain(`${TRAITS.length + 1}th character`)
  })

  it('tells the model the speaker field is what binds a part to a person', () => {
    expect(prompt).toMatch(/speaker/i)
    expect(prompt).toMatch(/CHARACTER FOR CHARACTER/)
  })

  it('does not tell the model to divide lines evenly', () => {
    // The floor is the requirement; evenness is the failure mode Jackson named in advance
    // ("scenes get stiff or evenly boring"). The prompt has to say so explicitly, because
    // "everyone gets at least 3" reads like "give everyone the same" to a model in a hurry.
    expect(prompt).toContain('NOT an instruction to divide the lines evenly')
  })

  it('scales the stated cast size with the actual cast', () => {
    const eight = getModeInstructions('ENSEMBLE', [...TRAITS, 'a', 'b', 'c'], SETTING, CIRCUMSTANCE)
    expect(eight).toContain('9th character')
    expect(eight).not.toContain('6th character')
  })
})

describe('HEAD_TO_HEAD cast instructions', () => {
  const prompt = getModeInstructions('HEAD_TO_HEAD', TRAITS.slice(0, 2), SETTING, CIRCUMSTANCE)

  it('carries both traits verbatim', () => {
    expect(prompt).toContain(TRAITS[0])
    expect(prompt).toContain(TRAITS[1])
  })

  it('rules out a third voice', () => {
    expect(prompt).toMatch(/no referee, no narrator/i)
  })
})

describe('SOLO cast instructions', () => {
  const prompt = getModeInstructions('SOLO', [TRAITS[0]], SETTING, CIRCUMSTANCE)

  it('carries the human trait verbatim', () => {
    expect(prompt).toContain(TRAITS[0])
  })

  it('still asks for an invented AI ensemble — SOLO is the mode where that is correct', () => {
    // The "no invented characters" rule must NOT leak into SOLO: the whole mode is one human
    // against 2-3 characters the model creates. bindCastToScript reports them as off-cast and
    // logCastBinding deliberately logs that at debug rather than warn for this mode.
    expect(prompt).toContain('GENERATE 2-3 SETTING-NATIVE CHARACTERS')
    expect(prompt).not.toContain('NOBODY ELSE EXISTS')
  })
})
