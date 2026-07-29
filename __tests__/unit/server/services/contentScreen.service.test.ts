/**
 * Content Screen Service — IP layer 3.
 *
 * Layer 3 is about what the MODEL volunteers, not what a player submits.
 * Layer 2 (cardCatalog.service) covers the latter.
 *
 * The two properties that matter, and both are asserted here:
 *   1. A protected name in generated prose does not reach `script_ready`.
 *   2. Ordinary dialogue is not mangled. A screen with false positives is a
 *      screen someone turns off, and a screen that is off catches nothing.
 */

import type { Script } from '../../../../lib/types'
import { screenScript } from '../../../../server/services/contentScreen.service'
import { PROTECTED_TERMS, REAL_PEOPLE } from '../../../../lib/protectedTerms'

jest.mock('../../../../lib/logger', () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))
import { logger } from '../../../../lib/logger'

function makeScript(overrides: Partial<Script> = {}): Script {
  return {
    title: 'A Perfectly Ordinary Evening',
    synopsis: 'Two people argue about a casserole.',
    lines: [
      { speaker: 'THE NEIGHBOUR', text: 'You said you would bring a side dish.' },
      { speaker: 'THE HOST', text: 'I brought vibes.' },
    ],
    ...overrides,
  } as Script
}

beforeEach(() => jest.clearAllMocks())

describe('redaction', () => {
  it('removes a franchise character named in dialogue', () => {
    const result = screenScript(makeScript({
      lines: [{ speaker: 'THE NEIGHBOUR', text: 'You look exactly like Darth Vader tonight.' }],
    } as Partial<Script>), 'ABCD')

    expect(result.redacted).toBe(true)
    expect(result.script.lines[0].text).not.toMatch(/Darth Vader/i)
    expect(result.hits.map(h => h.term)).toContain('Darth Vader')
  })

  it('removes a protected name from the title and synopsis', () => {
    const result = screenScript(makeScript({
      title: 'Hermione Granger Buys a Casserole',
      synopsis: 'A story set in Hogwarts, more or less.',
    }), 'ABCD')

    expect(result.script.title).not.toMatch(/Hermione Granger/i)
    expect(result.hits.some(h => h.where === 'title')).toBe(true)
  })

  it('flags a real person separately from a franchise', () => {
    const result = screenScript(makeScript({
      lines: [{ speaker: 'THE HOST', text: 'This casserole is a gift from Jerry Seinfeld.' }],
    } as Partial<Script>), 'ABCD')

    const hit = result.hits.find(h => h.term === 'Jerry Seinfeld')
    expect(hit?.category).toBe('real-person')
    expect(result.script.lines[0].text).not.toMatch(/Jerry Seinfeld/i)
  })

  it('matches case-insensitively — models shout in dialogue', () => {
    const result = screenScript(makeScript({
      lines: [{ speaker: 'THE HOST', text: 'WALTER WHITE IS AT THE DOOR.' }],
    } as Partial<Script>), 'ABCD')
    expect(result.script.lines[0].text).not.toMatch(/walter white/i)
  })

  it('handles terms whose edges are not word characters', () => {
    // `\b` fails on a trailing "." or "-", which is why the matcher uses
    // explicit lookarounds. WALL-E and Mr. Bean are the regression cases.
    for (const term of ['WALL-E', 'Mr. Bean']) {
      const result = screenScript(makeScript({
        lines: [{ speaker: 'THE HOST', text: `And then ${term} walked in.` }],
      } as Partial<Script>), 'ABCD')
      expect(result.hits.map(h => h.term)).toContain(term)
    }
  })
})

describe('speakers are detected but never rewritten', () => {
  it('logs a protected speaker without changing it', () => {
    // Rewriting `speaker` would detach the line from
    // `player.assignedCharacter`, which voting and gameHistory join on.
    const result = screenScript(makeScript({
      lines: [{ speaker: 'SHERLOCK HOLMES', text: 'The casserole is elementary.' }],
    } as Partial<Script>), 'ABCD')

    expect(result.script.lines[0].speaker).toBe('SHERLOCK HOLMES')
    expect(result.hits.some(h => h.where === 'speaker:0')).toBe(true)
  })
})

describe('false positives — the property that keeps this switched on', () => {
  const innocent = [
    'The boys are back in town and the office smells like burnt popcorn.',
    'It brought me joy, then anger, then sadness, in that order.',
    'She found a penny, eleven of them actually, under the cars.',
    'My friends said the alien soul of this casserole was frozen solid.',
    'Cheers to that. Monk mode. Fred said the same.',
    'We watched the boys inside out, home alone, for eleven hours.',
    // Both of these were real false positives caught by screening the repo's
    // own source with the term list. 'Die Hard' and 'Rapunzel' were removed
    // from PROTECTED_TERMS as a result; these pin that decision.
    'Some old habits die hard, and that one dies hardest.',
    'She let her hair down like Rapunzel and it hit the floor.',
  ]

  it.each(innocent)('leaves ordinary dialogue alone: %s', (text) => {
    const result = screenScript(makeScript({
      lines: [{ speaker: 'THE HOST', text }],
    } as Partial<Script>), 'ABCD')

    expect(result.hits).toEqual([])
    expect(result.script.lines[0].text).toBe(text)
    expect(result.redacted).toBe(false)
  })

  it('the term list itself contains no bare ordinary words', () => {
    // Guards the list against a future careless addition. If someone adds
    // "Friends" or "Cars" back, this fails rather than the screen quietly
    // firing on every third line of every game.
    const ordinary = new Set([
      'friends', 'cars', 'soul', 'alien', 'frozen', 'cheers', 'monk', 'joy',
      'anger', 'sadness', 'eleven', 'penny', 'fred', 'daphne', 'donkey',
      'the office', 'the boys', 'inside out', 'home alone', 'succession',
    ])
    const offenders = [...PROTECTED_TERMS, ...REAL_PEOPLE].filter(t => ordinary.has(t.toLowerCase()))
    expect(offenders).toEqual([])
  })
})

describe('audit trail', () => {
  it('logs room code and an ISO timestamp on a hit', () => {
    screenScript(makeScript({
      lines: [{ speaker: 'THE HOST', text: 'Ask Walter White.' }],
    } as Partial<Script>), 'WXYZ')

    const message = (logger.warn as jest.Mock).mock.calls[0][0] as string
    expect(message).toContain('[IP-SCREEN]')
    expect(message).toContain('room=WXYZ')
    expect(message).toMatch(/at=\d{4}-\d{2}-\d{2}T/)
    expect(message).toContain('Walter White')
  })

  it('says nothing when a script is clean', () => {
    screenScript(makeScript(), 'ABCD')
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

describe('purity', () => {
  it('never mutates the script it was given', () => {
    const script = makeScript({
      title: 'Darth Vader Buys a Casserole',
      lines: [{ speaker: 'THE HOST', text: 'Hello Walter White.' }],
    } as Partial<Script>)
    const before = JSON.parse(JSON.stringify(script))

    const result = screenScript(script, 'ABCD')

    expect(script).toEqual(before)
    expect(result.script).not.toBe(script)
  })

  it('returns the same object identity when nothing was redacted', () => {
    const script = makeScript()
    expect(screenScript(script, 'ABCD').script).toBe(script)
  })
})
