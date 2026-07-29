/**
 * Source-level IP audit of lib/content.ts.
 *
 * WHY THIS EXISTS AS A SEPARATE GATE. Every other IP check in this repo inspects RUNTIME
 * values: the layer-3 screen sees generated scripts, the catalog tests see exported names.
 * None of them can see the file. So when Chunk 4 layer 1 deleted the `source:` field from
 * all 375 entries but left four section comments naming the exact franchise the entries
 * beneath them came from, nothing failed. The catalog tests passed, the screen passed, the
 * done-criterion grep passed, and the attribution sat in the file for a full session.
 *
 * Deleting the data field while leaving the label is filing off a serial number and writing
 * it on the box. In an infringement analysis the comment is the worse artefact of the two,
 * for the same reason `homepagePosterBriefs.ts` was: exposure is what you did, intent is what
 * you wrote down about doing it.
 *
 * WHY THE FRANCHISE LIST IS HERE AND NOT IN protectedTerms.ts. It is deliberately NOT added
 * to the runtime redaction list, and that is a design decision rather than an oversight.
 * `PROTECTED_TERMS` is applied to generated prose with precision over recall — every entry
 * there is a term that would be alarming in a script. Franchise titles are not that shape:
 * "The Boys" and "Archer" are ordinary English, and adding them would redact "the boys went
 * to the pub" into "someone you would recognise went to the pub". Ruining live output to
 * catch a source comment is the wrong trade. A source comment is a BUILD-time problem and
 * belongs in a build-time gate.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { screenScript } from '../../../server/services/contentScreen.service'
import type { Script } from '../../../lib/types'

const CONTENT_PATH = join(__dirname, '../../../lib/content.ts')
const source = readFileSync(CONTENT_PATH, 'utf8')
const commentLines = source
  .split('\n')
  .filter((line) => line.trim().startsWith('//'))
  .join('\n')

/** Wrap arbitrary text so the PRODUCTION matcher can be pointed at it, rather than copied. */
function hitsIn(text: string) {
  const asScript = { title: '', synopsis: text, lines: [] } as unknown as Script
  return screenScript(asScript, 'content-source-audit').hits
}

/**
 * Franchise TITLES, as opposed to the character names in protectedTerms.ts.
 *
 * Source-audit only. Seeded with the four that were actually found in this file's comments
 * plus the franchises the catalog is most obviously grouped around. It is not exhaustive and
 * cannot be — like every denylist it finds what someone already thought of. It exists to stop
 * a KNOWN class of regression, not to prove the file is clean.
 */
const FRANCHISE_TITLES = [
  'Archer', 'Lucifer', 'The Boys', 'Ozark',
  'Breaking Bad', 'The Sopranos', 'The Office', 'Parks and Rec', 'Brooklyn Nine-Nine',
  'Star Wars', 'Star Trek', 'Harry Potter', 'Lord of the Rings', 'Doctor Who',
  'Shrek', 'Toy Story', 'Finding Nemo', 'SpongeBob', 'The Simpsons', 'Rick and Morty',
  'Game of Thrones', 'Stranger Things', 'The Mandalorian', 'Better Call Saul',
  'Kung Fu Panda', 'Back to the Future', 'Indiana Jones', 'James Bond', 'Die Hard',
  'Friends', 'Seinfeld', 'Frasier', 'Cheers', 'The Big Bang Theory', 'How I Met Your Mother',
]

describe('lib/content.ts source audit', () => {
  it('carries no named entity anywhere in the file, comments included', () => {
    // The whole file, not just the exported strings — that gap is what let the attribution
    // through. Uses the production matcher so this cannot drift from the live screen.
    const hits = hitsIn(source)
    expect(hits.map((h) => `${h.term} (${h.category})`)).toEqual([])
  })

  it('carries no franchise attribution in its section comments', () => {
    const found = FRANCHISE_TITLES.filter((title) => {
      const re = new RegExp(`(?<![A-Za-z0-9])${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i')
      return re.test(commentLines)
    })
    expect(found).toEqual([])
  })

  it('has no surviving `source:` field on any entry', () => {
    // Layer 1 deleted these. If one comes back, the catalog has started re-acquiring
    // attribution in the data as well as the comments.
    expect(source).not.toMatch(/^\s*source:/m)
  })

  it('screens the comment block specifically, so a genre label cannot smuggle a title', () => {
    expect(hitsIn(commentLines)).toEqual([])
  })
})
