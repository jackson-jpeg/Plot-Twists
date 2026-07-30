/**
 * ⚠️ EXPERIMENT — the Chunk 4 reversal A/B. Delete with `CastStyle` if the answer is "no".
 *
 *   [VPS] sudo npx tsx scripts/ab-generation.ts
 *
 * THE QUESTION. Jackson is reconsidering Chunk 4: are player-typed NAMES in a genre category slot
 * funnier than the trait deck that replaced them? That is a taste question, and the only honest
 * way to answer it is to generate scripts both ways and read them. This script generates them.
 *
 * WHAT IS HELD CONSTANT, because otherwise this measures nothing. Within a pair, both arms get:
 * the same setting, the same circumstance, the same seat count, the same customization, the same
 * model, the same temperature, the same line budget, and the same production `generateScript`.
 * The ONLY difference is `castStyle`, and `comedyPrompts.cast.test.ts` asserts that the 'trait'
 * default is byte-identical to the shipping prompt — so arm A is the product, not a replica of it.
 *
 * THE CREDENTIAL, AND THE RULE IT MUST NOT BREAK. The key is read from /etc/plotslop/env and
 * nowhere else — never a repo file, never .env.local, never a constant. That file is chmod 600
 * root:root, which is why this needs root. The harness forces a fake key and a local mock
 * unconditionally so no test path can ever spend money; this script is never imported by jest or
 * by the harness, and it is the only thing here besides real-generation.ts that spends anything.
 *
 * WHAT THE B CASTS ARE. Hand-authored to be what eight real people in a living room would
 * actually type into a category slot — recognisable, cross-era, cross-medium, and NOT curated to
 * flatter the design. Two extra arm-B-only runs at the end probe the failure modes Jackson named
 * (a cast that clusters on one show; a cast where every pick is obscure). Those are deliberately
 * OUTSIDE the blind packet: the blind test asks whether the design's normal case is funnier, and
 * smuggling its worst case into the same sample would answer a different question badly.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// ── credential, before anything imports the Anthropic SDK ────────────────────
const ENV_FILE = '/etc/plotslop/env'
let raw: string
try {
  raw = readFileSync(ENV_FILE, 'utf8')
} catch {
  console.error(`cannot read ${ENV_FILE} — run as root. Never paste the key into a repo file.`)
  process.exit(1)
}
const key = raw.match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key || key.startsWith('REPLACE') || key.length < 40) {
  console.error(`${ENV_FILE} has no usable ANTHROPIC_API_KEY`)
  process.exit(1)
}
process.env.ANTHROPIC_API_KEY = key
delete process.env.ANTHROPIC_BASE_URL // never inherit a mock pointer into a real run
process.env.LOG_LEVEL = 'warn'

import { MAX_PLAYERS } from '../server/utils/constants'

type Script = import('../lib/types').Script

const USD_PER_MTOK_IN = 3
const USD_PER_MTOK_OUT = 15
const cost = (i: number, o: number) => (i / 1e6) * USD_PER_MTOK_IN + (o / 1e6) * USD_PER_MTOK_OUT

const SEATS = MAX_PLAYERS.ENSEMBLE

const PRODUCTION_CUSTOMIZATION = {
  comedyStyle: 'witty',
  scriptLength: 'standard',
  difficulty: 'intermediate',
  physicalComedy: 'minimal',
  enableCallbacks: true,
} as const

// ── the six scenes, identical across both arms ───────────────────────────────
// Setting and circumstance IDs, resolved out of the LIVE catalog rather than pasted, so a scene
// that no longer exists fails loudly here instead of quietly testing a string nothing deals.
const SCENES = [
  { setting: 'set-village-hall-quiz-tiebreak', circumstance: 'circ-old-grudge-raised-worst-possible' },
  { setting: 'set-allnight-laundrette-working-machine-queue', circumstance: 'circ-phone-ringing-belongs-none' },
  { setting: 'set-departure-lounge-flight-keeps-changing', circumstance: 'circ-brought-slides' },
  { setting: 'set-sance-house-good-acoustics', circumstance: 'circ-tradition-being-observed-knows-words' },
  { setting: 'set-portacabin-building-site-lunch', circumstance: 'circ-second-cake' },
  { setting: 'set-escape-room-staff-gone-home', circumstance: 'circ-remain-until-admits-something' },
]

// ── arm B: the category deck, filled in by the player ────────────────────────
// `slot` is what the design SHIPS and what renders outside the room. `name` is what the player
// types, and it is the only part the model ever sees — which is the design's whole bet.
type Seat = { slot: string; name: string }

// THE NAMES LIVE IN A GITIGNORED FILE, AND THAT IS THE POINT.
//
// Chunk 4a's finding was that written instructions naming protected characters are a worse
// artefact than the exposure itself, because they are evidence of intent. A committed array of
// sixty franchise characters is that artefact with a different job title. So the casts are read
// from `.ab-casts.json`, which is gitignored, and this file — the part that IS committed —
// contains the harness and no names at all.
//
// It is also, usefully, a rehearsal of the design under evaluation: the slot ships, the name
// never does. If that discipline is impossible to hold in a throwaway experiment script, it is
// worth knowing before betting the product on holding it in a live game.
type CastFile = { casts: Seat[][]; attacks: Array<{ label: string; why: string; scene: number; cast: Seat[] }> }
const CASTS_FILE = join(__dirname, '../.ab-casts.json')
let castFile: CastFile
try {
  castFile = JSON.parse(readFileSync(CASTS_FILE, 'utf8'))
} catch {
  console.error(`missing ${CASTS_FILE} — see the comment above; it is deliberately not committed.`)
  process.exit(1)
}
const B_CASTS = castFile.casts
const B_ATTACKS = castFile.attacks

// ── measurement ──────────────────────────────────────────────────────────────
function distribution(script: Script, cast: string[]) {
  const counts = new Map(cast.map(c => [c, 0]))
  const offCast: string[] = []
  for (const line of script.lines) {
    if (counts.has(line.speaker)) counts.set(line.speaker, counts.get(line.speaker)! + 1)
    else offCast.push(line.speaker)
  }
  const per = cast.map(c => counts.get(c)!)
  const sorted = [...per].sort((a, b) => a - b)
  return {
    per,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    silent: per.filter(n => n === 0).length,
    belowFloor: per.filter(n => n < 3).length,
    offCast: Array.from(new Set(offCast)),
    words: script.lines.reduce((s, l) => s + l.text.trim().split(/\s+/).length, 0),
  }
}

async function main() {
  // Imported HERE, after the key is in process.env: the Anthropic client is constructed when
  // scriptGeneration.service is first evaluated, so a static import would build a credential-less
  // client and every call would 401.
  const { generateScript } = await import('../server/services/scriptGeneration.service')
  const { screenScript } = await import('../server/services/contentScreen.service')
  const { CHARACTERS, SETTINGS, CIRCUMSTANCES } = await import('../lib/content')
  const { CONFIG } = await import('../server/utils/config')

  const byId = <T extends { id: string; name: string }>(list: T[], id: string): string => {
    const hit = list.find(x => x.id === id)
    if (!hit) throw new Error(`no such catalog entry: ${id} — the scene list is stale`)
    return hit.name
  }

  // Arm A casts: eight traits per scene, drawn deterministically from the live safe deck so the
  // run is reproducible and so nobody can accuse the trait arm of a hand-picked hand.
  const safeTraits = CHARACTERS.filter(c => c.maturity === 'safe').map(c => c.name)
  const traitCast = (scene: number): string[] =>
    Array.from({ length: SEATS }, (_, k) => safeTraits[(scene * 37 + k * 13) % safeTraits.length])

  type Run = {
    arm: 'trait' | 'name'
    scene: number
    setting: string
    circumstance: string
    cast: string[]
    slots?: string[]
    script: Script
    usage: { inputTokens: number; outputTokens: number }
    dist: ReturnType<typeof distribution>
    screenHits: string[]
    attack?: string
  }
  const runs: Run[] = []

  const run = async (
    arm: 'trait' | 'name',
    scene: number,
    cast: string[],
    slots: string[] | undefined,
    attack?: string,
  ) => {
    const setting = byId(SETTINGS, SCENES[scene].setting)
    const circumstance = byId(CIRCUMSTANCES, SCENES[scene].circumstance)
    let usage = { inputTokens: 0, outputTokens: 0 }
    const script = await generateScript(
      cast,
      setting,
      circumstance,
      false,
      'ENSEMBLE',
      undefined,
      PRODUCTION_CUSTOMIZATION as never,
      undefined,
      u => { usage = u },
      arm,
    )
    const screened = screenScript(script, `ab-${arm}-${scene}${attack ? `-${attack}` : ''}`)
    const dist = distribution(script, cast)
    runs.push({
      arm, scene, setting, circumstance, cast, slots, script, usage, dist,
      screenHits: screened.hits.map(h => `${h.term} (${h.category})`),
      attack,
    })
    console.error(
      `  ${arm.padEnd(5)}${attack ? `/${attack}` : ''} — ${script.lines.length} lines · ` +
        `per-seat ${dist.per.join('/')} · off-cast ${dist.offCast.length} · ` +
        `layer3 hits ${screened.hits.length} · ` +
        `${usage.inputTokens}in/${usage.outputTokens}out $${cost(usage.inputTokens, usage.outputTokens).toFixed(4)}`,
    )
  }

  for (let s = 0; s < SCENES.length; s++) {
    console.error(`\n[pair ${s + 1}/${SCENES.length}] ${byId(SETTINGS, SCENES[s].setting)}`)
    await run('trait', s, traitCast(s), undefined)
    await run('name', s, B_CASTS[s].map(x => x.name), B_CASTS[s].map(x => x.slot))
  }

  for (const attack of B_ATTACKS) {
    console.error(`\n[attack: ${attack.label}] ${byId(SETTINGS, SCENES[attack.scene].setting)}`)
    await run('name', attack.scene, attack.cast.map(x => x.name), attack.cast.map(x => x.slot), attack.label)
  }

  writeFileSync(
    join(__dirname, '../.ab-generation.json'),
    JSON.stringify({ model: CONFIG.generation.model, seats: SEATS, customization: PRODUCTION_CUSTOMIZATION, runs }, null, 2),
  )

  const sum = (f: (r: Run) => number, p: (r: Run) => boolean) => runs.filter(p).reduce((a, r) => a + f(r), 0)
  for (const arm of ['trait', 'name'] as const) {
    const p = (r: Run) => r.arm === arm && !r.attack
    const n = runs.filter(p).length
    const i = sum(r => r.usage.inputTokens, p)
    const o = sum(r => r.usage.outputTokens, p)
    console.error(
      `\n${arm}: ${n} runs · mean ${Math.round(i / n)}in/${Math.round(o / n)}out · ` +
        `$${(cost(i, o) / n).toFixed(4)} per round`,
    )
  }
  const allIn = sum(r => r.usage.inputTokens, () => true)
  const allOut = sum(r => r.usage.outputTokens, () => true)
  console.error(`\nTOTAL SPEND: $${cost(allIn, allOut).toFixed(4)} across ${runs.length} generations`)
}

main().catch(e => { console.error(e); process.exit(1) })
