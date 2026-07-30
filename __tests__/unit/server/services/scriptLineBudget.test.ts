/**
 * The line budget and its token ceiling.
 *
 * These numbers are Jackson's rulings, not defaults, and each one has a reason recorded next to
 * it in `scriptCustomization.service.ts`. The tests pin the values so that changing one is a
 * deliberate act with a failing test attached, and check the two relationships that make the pair
 * safe: the ceiling must be able to hold the band, and the two branches of `generateScript` must
 * resolve to the same numbers.
 */

import {
  getLineCountRange,
  getMaxTokens,
} from '@/server/services/scriptCustomization.service'
import type { ScriptLength } from '@/lib/types'

/**
 * Measured, not assumed: 39 output tokens per line across the 2026-07-30 live generations
 * (36-38 on 2026-07-29). Used to check the ceiling against the band rather than eyeballing it.
 */
const TOKENS_PER_LINE = 39
/** Title and synopsis, which are not lines but are output. */
const TOKENS_OVERHEAD = 120

describe('script length band', () => {
  it('holds standard at 42-52 — Jackson 2026-07-30, raised from 30-38 when the cap went to 8', () => {
    expect(getLineCountRange('standard')).toEqual({ min: 42, max: 52 })
  })

  it.each([
    ['lightning', { min: 8, max: 12 }],
    ['quick', { min: 15, max: 25 }],
    ['epic', { min: 45, max: 60 }],
  ] as Array<[ScriptLength, { min: number; max: number }]>)(
    'holds %s unchanged',
    (length, range) => expect(getLineCountRange(length)).toEqual(range),
  )

  it('falls back to standard for an unknown length rather than to nothing', () => {
    expect(getLineCountRange('nonsense' as ScriptLength)).toEqual(getLineCountRange('standard'))
  })

  it('gives every band a min below its max', () => {
    for (const length of ['lightning', 'quick', 'standard', 'epic'] as ScriptLength[]) {
      const { min, max } = getLineCountRange(length)
      expect(min).toBeLessThan(max)
    }
  })
})

describe('token ceiling', () => {
  it('holds standard at 3,000 — raised with the band on 2026-07-30', () => {
    expect(getMaxTokens('standard')).toBe(3000)
  })

  /**
   * THE RELATIONSHIP THAT ACTUALLY MATTERS. A ceiling reached mid-JSON is not a short script, it
   * is a parse failure in front of a room full of people — `generateScript` throws on
   * `stop_reason === 'max_tokens'` by design. So the ceiling has to clear the worst case the band
   * permits with room to spare, and "with room to spare" is the part a human eyeballing two
   * numbers gets wrong.
   */
  it.each(['lightning', 'quick', 'standard', 'epic'] as ScriptLength[])(
    'leaves %s at least 10%% headroom over a full-length script',
    length => {
      const { max } = getLineCountRange(length)
      const worstCase = max * TOKENS_PER_LINE + TOKENS_OVERHEAD
      expect(getMaxTokens(length)).toBeGreaterThan(worstCase * 1.1)
    },
  )

  it('keeps standard cheaper than epic, which is the only ordering anything relies on', () => {
    expect(getMaxTokens('standard')).toBeLessThan(getMaxTokens('epic'))
  })

  it('applies no per-mode multiplier — cast size does not change tokens per line', () => {
    // An ENSEMBLE x1.25 used to live in getMaxTokens and quietly re-inflated the one mode that
    // had just been capped. The signature no longer takes a mode; this asserts it stays that way.
    expect(getMaxTokens.length).toBe(1)
  })
})
