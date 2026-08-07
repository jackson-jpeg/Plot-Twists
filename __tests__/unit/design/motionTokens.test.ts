/**
 * Drift gate: lib/motion re-states the design-token motion values as literals
 * (importing design/tokens from lib/motion duplicated the whole token module
 * into every route chunk — +21 kb, measured; see design/LEDGER.md iter 3).
 * This test is what makes that re-statement safe.
 */
import { MOTION } from '@/design/tokens'
import { EASE_CAMERA, DUR } from '@/lib/motion'

describe('lib/motion mirrors design/tokens MOTION', () => {
  it('camera easing matches', () => {
    expect(EASE_CAMERA).toEqual(MOTION.ease.camera)
  })
  it('durations match exactly', () => {
    expect(DUR).toEqual(MOTION.duration)
  })
})
