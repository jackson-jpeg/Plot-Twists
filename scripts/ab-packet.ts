/**
 * ⚠️ EXPERIMENT — renders the blind A/B packet from `.ab-generation.json`.
 *
 *   [VPS] npx tsx scripts/ab-packet.ts
 *
 * Writes two files:
 *   AB-PACKET.md  — six pairs, arms labelled A and B, NO commentary, NO scores, no arm names.
 *   .ab-key.json  — which letter was which arm. Gitignored, and not read by the packet.
 *
 * WHY THE ASSIGNMENT IS FIXED RATHER THAN RANDOM. A random shuffle would make the key
 * irreproducible from the repo, and the whole point of writing the key down separately is that
 * somebody can check afterwards that it was not quietly rewritten to match the verdict.
 *
 * ⚠️ "FIXED" MEANS "NOT RANDOMISED AT RUNTIME". IT DOES NOT MEAN "THE SAME ARM IN EVERY PAIR".
 * This ambiguity is not hypothetical — it is exactly how the packet shipped with a header
 * claiming "whatever A is in pair 1, it is in pair 6", which is false. A is re-drawn per pair.
 * Any tally BY LETTER across pairs is therefore meaningless, and worse than meaningless: a
 * unanimous 6-0 preference for one arm tallies by letter as 3 A / 3 B, so the instrument
 * returns "no difference" precisely when the answer is "unanimous". Verdicts are collected
 * per pair and tallied BY ARM after decoding against A_IS. See the emitted header below.
 *
 * WHAT THIS BLINDING DOES AND DOES NOT BUY, stated here rather than in the packet. The two arms
 * are visually distinguishable on sight: one has sentences for speaker names and the other has
 * proper nouns. Nothing can hide that, because it IS the change. What the blinding removes is the
 * thing that actually biases a read — knowing which one is the incumbent, and knowing which one
 * the person who prepared the packet is hoping wins.
 *
 * The trait arm is rendered with the FULL trait rather than the shipped short label. The short
 * label is a teleprompter affordance for somebody holding the card; a reader has no card. Where
 * the choice was arguable, it was made in favour of the arm this session did not want to win.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

type Line = { speaker: string; text: string; mood?: string }
type Run = {
  arm: 'trait' | 'name'
  scene: number
  setting: string
  circumstance: string
  cast: string[]
  slots?: string[]
  script: { title: string; synopsis: string; lines: Line[] }
  attack?: string
}

// Fixed, balanced 3/3, and deliberately not alternating — an alternating key is decodable from
// one correct guess. Balanced 3/3 is what makes a letter tally inverted rather than merely
// lossy (see the ⚠️ note in the file header): tally by arm, per pair, never by letter.
const A_IS: Array<'trait' | 'name'> = ['name', 'trait', 'name', 'name', 'trait', 'trait']

const data = JSON.parse(readFileSync(join(__dirname, '../.ab-generation.json'), 'utf8')) as { runs: Run[] }
const pairs = data.runs.filter(r => !r.attack)

const renderScript = (run: Run): string => {
  const out: string[] = []
  out.push(`**${run.script.title.toUpperCase()}**`)
  out.push('')
  out.push(`*${run.script.synopsis}*`)
  out.push('')
  out.push('```')
  for (const line of run.script.lines) {
    out.push(`${line.speaker.toUpperCase()}`)
    out.push(`    ${line.text}`)
  }
  out.push('```')
  return out.join('\n')
}

const md: string[] = []
md.push('# Which one is funnier?')
md.push('')
md.push('Six pairs. Each pair is the same setting and the same situation, generated twice.')
md.push('Everything else that could change the outcome — model, temperature, line budget, seat')
md.push('count, style settings — is identical within a pair.')
md.push('')
md.push('**⚠️ The letter assignment is re-drawn every pair.** A is not the same arm in pair 1 as in')
md.push('pair 6. An earlier version of this header claimed it was, and that claim was false — the')
md.push('assignment is a fixed 3/3 split across the six pairs, which means A changes arm partway')
md.push('through. Which arm is which is not recorded in this file.')
md.push('')
md.push('**Answer one verdict PER PAIR, and name the pair.** "Pair 1: A. Pair 2: B." — six answers,')
md.push('not one letter. A single letter for the whole packet cannot be scored, and a letter tally')
md.push('across pairs is meaningless.')
md.push('')
md.push('**Why this matters, stated plainly, because the earlier protocol was not merely awkward but')
md.push('inverted.** Since A is the same arm in only three of the six pairs, a *unanimous* 6–0')
md.push('preference for either arm tallies BY LETTER as exactly **3 A / 3 B**. The old instruction')
md.push('called a 3–3 letter split "a coin toss" that "prices the whole question at zero" — so the')
md.push('strongest possible result the packet can produce would have been read as the weakest. Tally')
md.push('by ARM, after decoding each pair against the key. Never by letter.')
md.push('')
md.push('If a given pair is genuinely a coin toss, say so for that pair. "No difference" is a real')
md.push('per-pair verdict. It is not a verdict about the packet.')
md.push('')
md.push('---')

for (let s = 0; s < 6; s++) {
  const trait = pairs.find(r => r.scene === s && r.arm === 'trait')!
  const name = pairs.find(r => r.scene === s && r.arm === 'name')!
  const a = A_IS[s] === 'trait' ? trait : name
  const b = A_IS[s] === 'trait' ? name : trait

  md.push('')
  md.push(`## Pair ${s + 1}`)
  md.push('')
  md.push(`**Setting** — ${trait.setting}`)
  md.push(`**Situation** — ${trait.circumstance}`)
  md.push('')
  md.push('### A')
  md.push('')
  md.push(renderScript(a))
  md.push('')
  md.push('### B')
  md.push('')
  md.push(renderScript(b))
  md.push('')
  md.push('---')
}

writeFileSync(join(__dirname, '../AB-PACKET.md'), md.join('\n') + '\n')
writeFileSync(
  join(__dirname, '../.ab-key.json'),
  JSON.stringify({ note: 'A_IS[pairIndex] — do not open before reading the packet.', A_IS }, null, 2),
)

const words = pairs.reduce((m, r) => {
  m[r.arm] = (m[r.arm] ?? 0) + r.script.lines.reduce((s, l) => s + l.text.trim().split(/\s+/).length, 0)
  return m
}, {} as Record<string, number>)
console.error(`AB-PACKET.md written — 6 pairs, 12 scripts, ${pairs.reduce((s, r) => s + r.script.lines.length, 0)} lines total`)
console.error(`words: trait ${words.trait} · name ${words.name}`)
