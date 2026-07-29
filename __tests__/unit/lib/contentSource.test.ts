/**
 * Source-level IP audit of the catalog and the prompt path.
 *
 * WHY THIS EXISTS AS A SEPARATE GATE. Every other IP check in this repo inspects RUNTIME values:
 * the layer-3 screen sees generated scripts, the catalog tests see exported names. None of them
 * can see a source file. So when Chunk 4 layer 1 deleted the `source:` field from all 375 entries
 * but left four section comments naming the exact franchise the entries beneath them came from,
 * nothing failed — the catalog tests passed, the screen passed, the done-criterion grep passed,
 * and the attribution sat in the file for a full session.
 *
 * WHY IT COVERS FOUR FILES AND NOT ONE. Widened 2026-07-29 after the same class of leak turned up
 * in three more places, none of them lib/content.ts:
 *
 *   - `comedyPrompts.ts` shipped `Structure it like "The Office" or "Community."` to the model on
 *     EVERY ensemble round. Not a comment — live production text, in the request body.
 *   - `content-types.ts` documented its own fields with `// "Michael Scott"` and `// "The Office"`.
 *   - `content.ts` itself carried `Trapped in a Saw-like scenario` as a live catalog ENTRY NAME.
 *
 * The production matcher returns ZERO on the first and third of those, because its term list was
 * generated from character names and holds no franchise titles at all. It returns two hits on the
 * second. That is the whole argument for a build-time gate that reads text: the runtime screen is
 * structurally unable to see most of this, and where it can see it, nobody was pointing it there.
 *
 * WHY THE FRANCHISE LIST IS HERE AND NOT IN protectedTerms.ts. Deliberate, not an oversight.
 * `PROTECTED_TERMS` is applied to generated prose with precision over recall — every entry there
 * is a term that would be alarming in a script. Franchise titles are not that shape: "The Boys",
 * "Archer", "Friends", "Saw" and "Community" are ordinary English, and adding them would redact
 * "the boys went to the pub" into "someone you would recognise went to the pub". Ruining live
 * output to catch a source comment is the wrong trade. A source comment is a BUILD-time problem.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { screenScript } from '../../../server/services/contentScreen.service'
import { CHARACTERS, SETTINGS, CIRCUMSTANCES } from '../../../lib/content'
import type { Script } from '../../../lib/types'
import type { ContentItem } from '../../../lib/content-types'

const ROOT = join(__dirname, '../../..')

/**
 * Every file that carries catalog or prompt TEXT. Four of these five had leaked; the fifth is the
 * generator, which is authored by hand and is the obvious next place for one to appear.
 *
 * `scriptGeneration.service.ts` is the one that should worry anyone reading this. Its leak was not
 * a comment and not a catalog entry — the live user prompt read "Write in the distinct voice of
 * each character (Yoda talks like Yoda, pirates talk like pirates)", so every generation request
 * ever sent handed the model a protected name and an instruction to imitate it. And `Yoda` was not
 * in `protectedTerms.ts`, so the layer-3 screen could not have caught it coming back either. Both
 * are fixed; the point of listing the file here is that nothing was watching this surface at all.
 */
const AUDITED_FILES = [
  'lib/content.ts',
  'lib/content-types.ts',
  'scripts/build-catalog.ts',
  'server/services/prompts/comedyPrompts.ts',
  'server/services/scriptGeneration.service.ts',
]

const sources = Object.fromEntries(
  AUDITED_FILES.map(f => [f, readFileSync(join(ROOT, f), 'utf8')]),
) as Record<string, string>

/** Wrap arbitrary text so the PRODUCTION matcher can be pointed at it, rather than copied. */
function hitsIn(text: string) {
  const asScript = { title: '', synopsis: text, lines: [] } as unknown as Script
  return screenScript(asScript, 'content-source-audit').hits
}

/**
 * Franchise TITLES, as opposed to the character names in protectedTerms.ts. Source-audit only.
 *
 * Seeded with the titles actually found in these files across two sessions, plus the franchises
 * the old catalog was most obviously grouped around. Not exhaustive and cannot be — like every
 * denylist it finds what somebody already thought of. It exists to stop a KNOWN class of
 * regression, not to prove the files are clean.
 */
const FRANCHISE_TITLES = [
  'Breaking Bad', 'The Sopranos', 'Parks and Rec', 'Brooklyn Nine-Nine',
  'Star Wars', 'Star Trek', 'Harry Potter', 'Lord of the Rings', 'Doctor Who',
  'Shrek', 'Toy Story', 'Finding Nemo', 'SpongeBob', 'The Simpsons', 'Rick and Morty',
  'Game of Thrones', 'Stranger Things', 'The Mandalorian', 'Better Call Saul',
  'Kung Fu Panda', 'Back to the Future', 'Indiana Jones', 'James Bond', 'Die Hard',
  'Seinfeld', 'Frasier', 'The Big Bang Theory', 'How I Met Your Mother',
  'The Good Place', 'Ted Lasso', 'The Lion King',
  'Wizard of Oz', 'Guardians of the Galaxy', 'Mad Men', 'Peaky Blinders', 'Twin Peaks',
]

/**
 * Titles that are also ordinary English, and therefore matched only in ATTRIBUTIVE POSITION.
 *
 * A bare word-boundary match on these does not work, and the first version of this gate proved it
 * by failing on `A Community Centre Mid-Refurbishment` — a real catalog entry that has nothing to
 * do with the sitcom. `Saw` matches "somebody saw it"; `Friends` matches "invite friends"; `Cars`
 * matches cars. Flagging those would train everyone to ignore this gate, which is worse than not
 * having it.
 *
 * Both leaks actually observed in this repo were attributive: `Structure it like "The Office" or
 * "Community."` (quoted) and `Trapped in a Saw-like scenario` (hyphenated). That is the shape of a
 * reference to a work, as opposed to a use of the word. So: quoted, or `X-like`/`X-style`/`X-esque`.
 *
 * `The Office` and `The Wire` sit here rather than in the strict list for the same reason, and the
 * second one is why: the strict check flagged this repo's own sentence "…to keep off the wire",
 * about a network wire. `Cheers` and `Succession` are ordinary words too.
 *
 * THE LIMITATION, STATED RATHER THAN HIDDEN. A bare section comment reading `// Crime/Drama - The
 * Wire` would NOT be caught by the attributive check. That class is caught for the 36 unambiguous
 * titles and not for these nine. The alternative was a gate that cries wolf on "the office", which
 * trains everyone to ignore it — a gate nobody trusts catches nothing at all.
 */
const AMBIGUOUS_TITLES = [
  'Saw', 'Community', 'Friends', 'Archer', 'Lucifer', 'Ozark', 'The Boys', 'Cars', 'Up',
  'The Office', 'The Wire', 'Cheers', 'Succession',
]

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function findTitles(text: string): string[] {
  const found: string[] = []
  for (const t of FRANCHISE_TITLES) {
    if (new RegExp(`(?<![A-Za-z0-9])${esc(t)}(?![A-Za-z0-9])`, 'i').test(text)) found.push(t)
  }
  for (const t of AMBIGUOUS_TITLES) {
    const e = esc(t)
    const attributive = new RegExp(`["'\`]${e}[."'\`]|(?<![A-Za-z0-9])${e}-(?:like|style|esque)\\b`)
    if (attributive.test(text)) found.push(t)
  }
  return found
}

describe('catalog + prompt source audit', () => {
  describe.each(AUDITED_FILES)('%s', file => {
    it('carries no named entity anywhere in the file, comments included', () => {
      // The whole file, not just the exported strings — that gap is what let the attribution
      // through. Uses the production matcher so this cannot drift from the live screen.
      const hits = hitsIn(sources[file])
      expect(hits.map(h => `${h.term} (${h.category})`)).toEqual([])
    })

    it('carries no franchise title, in code or in comments', () => {
      // The production matcher CANNOT do this one — its term list holds character names, not
      // titles, and returns zero on a file containing "The Office". Hence a second instrument.
      expect(findTitles(sources[file])).toEqual([])
    })
  })

  it('has no surviving `source:` field on any catalog entry', () => {
    // Layer 1 deleted these. If one comes back, the catalog has started re-acquiring attribution
    // in the data as well as in the comments.
    expect(sources['lib/content.ts']).not.toMatch(/^\s*source:/m)
  })
})

describe('card grammar — the character slot is a trait, not a person', () => {
  /**
   * The structural tell of the paraphrase failure.
   *
   * Every entry in the old deck read "A <noun> who <does something>" — "A grumpy swamp ogre who
   * just wants to be left alone". That shape IS a person: it names a kind of being and then
   * describes them, which is exactly what makes it map 1:1 onto one protected original. A trait
   * has no article because there is nobody there to introduce — "Insists nothing is wrong at
   * increasing volume".
   *
   * This is a proxy, not a proof. A determined rewrite could keep the 1:1 mapping while dropping
   * the article. The human done-criterion (sample 30, try to name them) is the real check; this
   * catches the regression mechanically so the human check is not the only thing standing there.
   */
  it('no character entry is introduced as a person', () => {
    const offenders = CHARACTERS.filter(c => /^(A|An|The)\s/.test(c.name)).map(c => c.name)
    expect(offenders).toEqual([])
  })

  it('no character entry names a job title used as an identity', () => {
    // "A regional manager", "A twice-divorced paleontologist" — the old deck's spine. A trait may
    // mention work ("Explains your own job to you"); it may not BE a job.
    const offenders = CHARACTERS.filter(c =>
      /^(A|An|The)?\s*[A-Za-z-]*\s?(manager|detective|wizard|physicist|chef|lawyer|assistant|receptionist|architect|psychiatrist|paleontologist|intern|actor|actress|teacher|musician|buyer)\b/i.test(
        c.name,
      ),
    ).map(c => c.name)
    expect(offenders).toEqual([])
  })
})

describe('catalog ordering carries no grouping', () => {
  /**
   * The old catalog was ordered franchise by franchise, in cast order: the first four entries were
   * one sitcom ensemble, then the next four another, then the superheroes, then the space opera.
   * That grouping identifies entries that are individually deniable — four generic office workers
   * in a row are an office, and everybody knows which one. Category is the surviving observable of
   * it, so category adjacency is the regression signal.
   *
   * WHY NOT LONGEST-RUN. That was the first version of this gate and it was WRONG: it demanded no
   * run longer than three, which a genuinely random shuffle cannot satisfy. The character deck is
   * ~48% one category, so chance alone produces runs of eight. It failed the correct file, which
   * is the worse direction for a gate to fail in — it would have been "fixed" by un-randomising
   * the order.
   *
   * The right measure is the rate of adjacent same-category pairs compared against the rate a
   * random permutation of THIS category distribution would give, which is Σpᵢ². Self-adjusting,
   * so re-authoring the deck cannot silently invalidate it.
   *
   *   deck            observed   random    ratio
   *   characters old     0.857     0.170     5.0×
   *   settings old       0.689     0.147     4.7×
   *   circumstances old  0.608     0.220     2.8×
   *   characters new     0.260     0.264     0.98×
   *   settings new       0.200     0.192     1.04×
   *   circumstances new  0.606     0.568     1.07×
   *
   * The margin is 0.10 absolute — about 3.5σ for these deck sizes, and roughly seven times clear
   * of anything the old file did.
   */
  const MARGIN = 0.1

  const rates = (items: ContentItem[]) => {
    const counts: Record<string, number> = {}
    for (const i of items) counts[i.category] = (counts[i.category] ?? 0) + 1
    const expected = Object.values(counts).reduce((s, c) => s + (c / items.length) ** 2, 0)
    let adjacent = 0
    for (let i = 1; i < items.length; i++) {
      if (items[i].category === items[i - 1].category) adjacent++
    }
    return { observed: adjacent / (items.length - 1), expected }
  }

  it.each([
    ['characters', CHARACTERS],
    ['settings', SETTINGS],
    ['circumstances', CIRCUMSTANCES],
  ])('%s are ordered no more clumpily than chance', (_label, items) => {
    const { observed, expected } = rates(items as ContentItem[])
    expect(observed).toBeLessThanOrEqual(expected + MARGIN)
  })
})
