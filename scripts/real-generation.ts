/**
 * Real script generation against the live Anthropic API, for the playtest packet.
 *
 *   [VPS] sudo npx tsx scripts/real-generation.ts
 *
 * WHY THIS IS A SEPARATE SCRIPT FROM THE HARNESS, AND MUST STAY ONE. The harness points
 * ANTHROPIC_BASE_URL at a local mock and forces a fake key, unconditionally, so no test path can
 * ever spend money or leak the credential. That property is worth more than the convenience of
 * reusing it. This script is the only thing in the repo that talks to the real API, it is never
 * invoked by jest or by the harness, and it costs real money every run.
 *
 * THE KEY IS READ FROM /etc/plotslop/env AND NOWHERE ELSE. Not from a repo file, not from
 * .env.local, not from a constant. That file is chmod 600 root:root, so this needs root — which
 * is a feature: it makes accidentally running this from a normal shell impossible rather than
 * merely unlikely.
 *
 * WHAT IT MEASURES. Token usage comes from `finalMessage.usage` via the production
 * `generateScript` path, not from an estimate and not from a re-implementation, so the numbers
 * are what the product actually spends.
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
// Set BEFORE the service modules are imported. The logger resolves its level from the
// environment, and the director's-review usage line is emitted at info — raising the level after
// import is too late to be sure of catching it.
process.env.LOG_LEVEL = 'info'

type Room = import('../lib/types').Room
type Script = import('../lib/types').Script

// ── list price, Sonnet 4.5 ───────────────────────────────────────────────────
const USD_PER_MTOK_IN = 3
const USD_PER_MTOK_OUT = 15
const cost = (i: number, o: number) => (i / 1e6) * USD_PER_MTOK_IN + (o / 1e6) * USD_PER_MTOK_OUT

const PLAYERS = 8
const SCRIPTS = 3

/**
 * The customization a real game sends.
 *
 * CHANGED 2026-07-29, AND THE CHANGE IS THE POINT. The first run passed `undefined` here, which
 * took generateScript's DEFAULT branch. The host UI defaults scriptLength:'standard' and emits it
 * with the room settings, so a real game takes the CUSTOMIZATION branch — a different line range,
 * a different token ceiling, and several hundred extra input tokens of style/difficulty prompt.
 * Measuring the branch nobody plays is how a length cap gets validated green and ships inert.
 */
const PRODUCTION_CUSTOMIZATION = {
  comedyStyle: 'witty',
  scriptLength: 'standard',
  difficulty: 'intermediate',
  physicalComedy: 'minimal',
  enableCallbacks: true,
} as const

function fakeRoom(code: string): Room {
  return {
    code,
    host: { id: 'h', publicId: 'h', nickname: 'Host', role: 'HOST', isHost: true, socketId: '' },
    players: new Map(),
    gameState: 'SELECTION',
    gameMode: 'ENSEMBLE',
    isMature: false,
    selections: new Map(),
    currentLineIndex: 0,
    isPaused: false,
    votes: new Map(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
  } as Room
}

const pick = <T,>(a: T[], i: number): T => a[i % a.length]

async function main() {
  // Imported HERE, not at module scope, and the ordering is load-bearing rather than stylistic:
  // the Anthropic client in scriptGeneration.service is constructed when that module is first
  // evaluated, so importing it before the key is in process.env builds a client with no
  // credential and every call 401s. Static imports would hoist above the file-read above.
  const { generateScript } = await import('../server/services/scriptGeneration.service')
  const { dealCards } = await import('../server/services/cardCatalog.service')
  const { screenScript } = await import('../server/services/contentScreen.service')
  const { CONFIG } = await import('../server/utils/config')

  const results: Array<{
    traits: string[]
    setting: string
    circumstance: string
    script: Script
    usage: { inputTokens: number; outputTokens: number }
    hits: string[]
  }> = []

  for (let r = 0; r < SCRIPTS; r++) {
    const dealt = await dealCards(fakeRoom(`R${r}`))
    const traits = Array.from({ length: PLAYERS }, (_, k) => pick(dealt.characters, r * 11 + k * 3).name)
    const setting = pick(dealt.settings, r * 5 + 1).name
    const circumstance = pick(dealt.circumstances, r * 7 + 2).name

    console.error(`[${r + 1}/${SCRIPTS}] generating — ${setting} / ${circumstance}`)

    let usage = { inputTokens: 0, outputTokens: 0 }
    const script = await generateScript(
      traits,
      setting,
      circumstance,
      false,
      'ENSEMBLE',
      undefined,
      PRODUCTION_CUSTOMIZATION as never,
      undefined,
      u => { usage = u },
    )

    const screened = screenScript(script, `real-gen-${r + 1}`)
    results.push({
      traits,
      setting,
      circumstance,
      script,
      usage,
      hits: screened.hits.map(h => `${h.term} (${h.category})`),
    })
    console.error(`      ${script.lines.length} lines · ${usage.inputTokens} in / ${usage.outputTokens} out — $${cost(usage.inputTokens, usage.outputTokens).toFixed(4)}`)
  }

  // ── the ceiling on a mode nobody measured ────────────────────────────────
  // `standard` is now 2,600 tokens for EVERY mode, but every measurement behind that number is
  // 8-player ENSEMBLE. SOLO has one performer and three AI parts, which is the shape most likely
  // to produce long speeches and therefore more tokens per line. Shipping an unmeasured ceiling
  // on the strength of a measured one is the guess this run exists to avoid: one generation is
  // ~$0.05 and turns it into a fact. A truncation here throws, by design, and fails this script.
  let soloUsage = { inputTokens: 0, outputTokens: 0 }
  const soloDealt = await dealCards(fakeRoom('SOLO'))
  const soloScript = await generateScript(
    [pick(soloDealt.characters, 17).name],
    pick(soloDealt.settings, 9).name,
    pick(soloDealt.circumstances, 4).name,
    false,
    'SOLO',
    undefined,
    PRODUCTION_CUSTOMIZATION as never,
    undefined,
    u => { soloUsage = u },
  )
  console.error(
    `SOLO ceiling check: ${soloScript.lines.length} lines · ` +
      `${soloUsage.inputTokens} in / ${soloUsage.outputTokens} out — not truncated`,
  )

  // ── the OTHER call in a complete round ──────────────────────────────────
  // A round is not one API call. generateDirectorsReview fires after voting on every completed
  // round whenever a key is present, so leaving it out would understate the per-round cost.
  // Measured rather than estimated, for the same reason as everything else here.
  const { generateDirectorsReview } = await import('../server/services/directorsReview.service')
  const first = results[0]
  let reviewUsage = { inputTokens: 0, outputTokens: 0 }
  // The logger prefixes a level tag, so the message is not argv[0] — join everything.
  const origInfo = console.log
  console.log = (...a: unknown[]) => {
    const hit = a.map(String).join(' ').match(/\[DirectorsReview\] Token usage: (\d+) in \/ (\d+) out/)
    if (hit) reviewUsage = { inputTokens: Number(hit[1]), outputTokens: Number(hit[2]) }
    origInfo(...(a as []))
  }
  const review = await generateDirectorsReview({
    title: first.script.title,
    synopsis: first.script.synopsis,
    cast: first.traits.map((t, i) => ({ nickname: `Player ${i + 1}`, character: t, isWinner: i === 0 })),
    reactionCount: 42,
    plotTwists: [],
  })
  console.log = origInfo
  console.error(`director's review: ${reviewUsage.inputTokens} in / ${reviewUsage.outputTokens} out — $${cost(reviewUsage.inputTokens, reviewUsage.outputTokens).toFixed(4)}`)

  writeFileSync(
    join(__dirname, '../.real-generation.json'),
    JSON.stringify(
      {
        model: CONFIG.generation.model,
        players: PLAYERS,
        customization: PRODUCTION_CUSTOMIZATION,
        results,
        review,
        reviewUsage,
        solo: { lines: soloScript.lines.length, usage: soloUsage },
      },
      null,
      2,
    ),
  )

  const totalIn = results.reduce((s, r) => s + r.usage.inputTokens, 0)
  const totalOut = results.reduce((s, r) => s + r.usage.outputTokens, 0)
  console.error(`\ntotal ${totalIn} in / ${totalOut} out — $${cost(totalIn, totalOut).toFixed(4)}`)
  console.error(`mean per round: ${Math.round(totalIn / SCRIPTS)} in / ${Math.round(totalOut / SCRIPTS)} out`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
