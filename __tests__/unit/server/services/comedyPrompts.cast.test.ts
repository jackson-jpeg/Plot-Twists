/**
 * The cast instructions in the prompt.
 *
 * `bindCastToScript` can only snap a speaker onto a cast member the model was actually shown. If
 * the prompt ever stops carrying the trait strings VERBATIM — a rewrap, a truncation, a tidy-up
 * that lowercases them — the binding silently reverts to what it was before 2026-07-30: every
 * part belonging to nobody, with no error anywhere. These assert the prompt's half of the
 * contract, which is the half no runtime check can see.
 */

import { getModeInstructions, getSystemPrompt } from '@/server/services/prompts/comedyPrompts'
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

/**
 * ⚠️ THE GUARD ON THE EXPERIMENT SCAFFOLDING — delete this block with the `CastStyle` type.
 *
 * `castStyle` exists so the Chunk-4-reversal A/B could be generated through the real production
 * pipeline rather than a replica of it. The only thing that makes that safe is the default
 * producing BYTE-IDENTICAL output to the un-parameterised call, and "byte-identical" is a claim
 * that decays the moment somebody edits either branch of the ternary. So it is asserted, not
 * assumed — and asserted on the whole string, not on a sample of its properties.
 */
describe('castStyle scaffolding does not touch shipping behaviour', () => {
  const MODES = ['SOLO', 'HEAD_TO_HEAD', 'ENSEMBLE'] as const

  it.each(MODES)('%s: the default is byte-identical to no argument at all', mode => {
    const cast = mode === 'SOLO' ? TRAITS.slice(0, 1) : mode === 'HEAD_TO_HEAD' ? TRAITS.slice(0, 2) : TRAITS
    expect(getModeInstructions(mode, cast, SETTING, CIRCUMSTANCE, 'trait')).toBe(
      getModeInstructions(mode, cast, SETTING, CIRCUMSTANCE),
    )
  })

  it.each([false, true])('system prompt (isMature=%s): the default is byte-identical', isMature => {
    expect(getSystemPrompt(isMature, undefined, 'trait')).toBe(getSystemPrompt(isMature))
  })

  it('the shipping system prompt still forbids naming a franchise character', () => {
    expect(getSystemPrompt(false)).toContain('Never write a')
    expect(getSystemPrompt(false)).toMatch(/named character from an\nexisting film/)
  })

  // Non-vacuity. If 'name' produced the same string, every assertion above would pass while the
  // A/B compared an arm against itself — which is the exact shape of the 4.71-vs-0.00 error.
  it("'name' really does produce a different prompt, or the A/B compared nothing", () => {
    const shipping = getModeInstructions('ENSEMBLE', TRAITS, SETTING, CIRCUMSTANCE)
    const experiment = getModeInstructions('ENSEMBLE', TRAITS, SETTING, CIRCUMSTANCE, 'name')
    expect(experiment).not.toBe(shipping)
    expect(experiment).not.toContain('these are sentences rather than names')
    expect(getSystemPrompt(false, undefined, 'name')).not.toContain('Never write a')
  })

  it("'name' keeps the cast list and the binding rules that make a part readable", () => {
    // Whatever the deck is, the speaker string still has to equal the card in somebody's hand.
    // The A/B is worthless if arm B quietly drops the constraint arm A is measured against.
    const experiment = getModeInstructions('ENSEMBLE', TRAITS, SETTING, CIRCUMSTANCE, 'name')
    for (const trait of TRAITS) expect(experiment).toContain(trait)
    expect(experiment).toContain('COPIED CHARACTER FOR CHARACTER')
    expect(experiment).toContain(`AT LEAST ${MIN_LINES_PER_CHARACTER} lines`)
    expect(experiment).toContain('NOBODY ELSE EXISTS')
  })
})
