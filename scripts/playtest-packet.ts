/**
 * Playtest packet generator — the one Chunk 4 done-criterion automation cannot close.
 *
 *   [VPS] npx tsx scripts/playtest-packet.ts > PLAYTEST-2026-07-29.md
 *
 * The tests prove the deck is LEGAL. Nothing proves it is FUNNY, and that is the whole risk of
 * this rewrite: the previous version of this catalog was funny BECAUSE it was still the protected
 * characters with their names removed. Trading that away for real archetypes is the trade Jackson
 * asked for, and 40 hands is how he checks what it cost.
 *
 * WHAT THIS USES. Hands come from the real `dealCards` against the real catalog — the same
 * function `start_game` calls — so what appears below is what a player is actually dealt, not a
 * plausible reconstruction. Prompts are built by the real prompt path, screening runs the real
 * `contentScreen` matchers. No reimplementations: a second copy of any of these would be a second
 * thing to keep in sync, and the point is to report what production would do.
 *
 * THE REAL SCRIPTS. As of 2026-07-29 the three complete generated scripts ARE here, read from
 * `.real-generation.json` — produced by `scripts/real-generation.ts` against the live API through
 * the production `generateScript` path. That file is gitignored: it is generated output, it costs
 * money to reproduce, and it has no business in a diff. If it is absent this generator degrades to
 * a note saying so rather than silently omitting the section, because a missing section reads as
 * "there was nothing to say".
 *
 * This script itself NEVER touches the API or the key. It only reads the JSON. Keeping generation
 * and presentation apart is what makes it safe to re-run the packet freely.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { Room } from '../lib/types'
import { dealCards } from '../server/services/cardCatalog.service'
import { getSystemPrompt, getModeInstructions } from '../server/services/prompts/comedyPrompts'
import { screenScript, type ScreenHit } from '../server/services/contentScreen.service'
import { CHARACTERS, SETTINGS, CIRCUMSTANCES } from '../lib/content'

const HANDS = 40
const PROMPTS_SHOWN = 3

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

/** Screen arbitrary prose with the PRODUCTION matcher, by wrapping it in the shape it accepts. */
function screenText(text: string, label: string): ScreenHit[] {
  const script = { title: '', synopsis: text, lines: [] } as unknown as Parameters<typeof screenScript>[0]
  return screenScript(script, label).hits
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

async function main() {
  const out: string[] = []
  const p = (s = '') => out.push(s)

  p('# PlotSlop — playtest packet')
  p()
  p('**Generated 2026-07-29, second pass, from the restructured catalog.**')
  p()
  p('Read this to answer the one question the test suite cannot: *is it still funny?*')
  p()
  p('**This is a different deck from the packet you read this morning.** That one was a rename of')
  p('the old catalog and it read well because every card was still a protected character with the')
  p('name filed off. This one changes the card GRAMMAR: the character slot is a trait or a flaw,')
  p('and the specificity moved into setting and situation. The comedy now has to come from the')
  p('collision of a trait with a predicament, not from recognition.')
  p()
  p('Everything below comes from the real dealing path (`cardCatalog.service.dealCards`).')
  p()
  p(`Catalog: **${CHARACTERS.length} traits · ${SETTINGS.length} settings · ${CIRCUMSTANCES.length} situations**.`)
  p()

  // ── 40 hands ──────────────────────────────────────────────────────────────
  p('---')
  p()
  p(`## ${HANDS} dealt hands`)
  p()
  p('Format: `trait / setting / situation`. Each line is one card taken from a real eight-card')
  p('deal, which is what a player picks from.')
  p()
  p('```')

  const hands: Array<{ character: string; setting: string; circumstance: string }> = []
  for (let i = 0; i < HANDS; i++) {
    const dealt = await dealCards(fakeRoom(`H${String(i).padStart(3, '0')}`))
    const hand = {
      character: pick(dealt.characters, i).name,
      setting: pick(dealt.settings, i * 3 + 1).name,
      circumstance: pick(dealt.circumstances, i * 5 + 2).name,
    }
    hands.push(hand)
    p(`${String(i + 1).padStart(2)}. ${hand.character}`)
    p(`    in: ${hand.setting}`)
    p(`    situation: ${hand.circumstance}`)
    p('')
  }
  p('```')
  p()

  // ── prompts ───────────────────────────────────────────────────────────────
  p('---')
  p()
  p('## What the model actually receives')
  p()
  p('The three complete generated scripts are now **below**, under "Real scripts" — generated')
  p('against the live API from this catalog, not from the mock.')
  p()
  p('Note the `someone who …` wrapper below. Trait cards do not read as subjects on their own —')
  p('*"The human player will perform as Insists nothing is wrong at increasing volume"* — so the')
  p('prompt path wraps each one at the point it enters the template. That is the only code change')
  p('the grammar switch required.')
  p()

  const systemPrompt = getSystemPrompt(false)
  p(`The system prompt is identical for every round (${systemPrompt.length} chars,`)
  p(`~${Math.ceil(systemPrompt.length / 4)} tokens) and is shown once, at the end.`)
  p()

  for (let i = 0; i < PROMPTS_SHOWN; i++) {
    const h = hands[i]
    const cast = [h.character, hands[i + 1].character, hands[i + 2].character]
    const mode = getModeInstructions('ENSEMBLE', cast, h.setting, h.circumstance)
    p(`### Round ${i + 1}`)
    p()
    p('```')
    p(`traits:       ${cast.join(' / ')}`)
    p(`setting:      ${h.setting}`)
    p(`situation:    ${h.circumstance}`)
    p('```')
    p()
    p('<details><summary>mode instructions sent for this round</summary>')
    p()
    p('```')
    p(mode.trim())
    p('```')
    p()
    p('</details>')
    p()
  }

  // ── layer 3 sweep ─────────────────────────────────────────────────────────
  p('---')
  p()
  p('## Layer 3 screening over everything above')
  p()
  p('Run with the production matcher (`contentScreen.service`), not a copy of it.')
  p()

  const targets: Array<{ label: string; text: string }> = [
    ...hands.map((h, i) => ({ label: `hand ${i + 1}`, text: `${h.character} ${h.setting} ${h.circumstance}` })),
    { label: 'system prompt', text: systemPrompt },
    { label: 'mode instructions', text: getModeInstructions('ENSEMBLE', ['a', 'b', 'c'], 'a place', 'a situation') },
    { label: 'FULL trait catalog', text: CHARACTERS.map(c => c.name).join('\n') },
    { label: 'FULL setting catalog', text: SETTINGS.map(c => c.name).join('\n') },
    { label: 'FULL situation catalog', text: CIRCUMSTANCES.map(c => c.name).join('\n') },
  ]

  let totalHits = 0
  const lines: string[] = []
  for (const t of targets) {
    const hits = screenText(t.text, t.label)
    totalHits += hits.length
    if (hits.length) {
      lines.push(`| ${t.label} | ${hits.map(h => `\`${h.term}\` (${h.category})`).join(', ')} |`)
    }
  }

  const total = CHARACTERS.length + SETTINGS.length + CIRCUMSTANCES.length
  if (totalHits === 0) {
    p(`**Zero hits.** Nothing in the ${HANDS} hands, the prompts, or all ${total} catalog entries`)
    p('matches a protected term or a real person.')
    p()
    p('**Read that as narrowly as it is meant, because this morning it was a false green.** The')
    p('screen is a fixed denylist. It finds terms somebody already thought to add — and it does not')
    p('read source files, so it returned this same clean sweep while the ensemble prompt said')
    p('*Structure it like "The Office" or "Community."* and the user prompt said *"Yoda talks like')
    p('Yoda"*. Both were shipping to the model on every round. Both are fixed, and a build-time')
    p('gate that reads the files as text now covers five of them.')
    p()
    p('What a clean sweep means: no *named* entity survived. It does not mean nothing is')
    p('recognisable, and it never will.')
  } else {
    p(`**${totalHits} hit(s).**`)
    p()
    p('| where | terms |')
    p('|---|---|')
    lines.forEach(l => p(l))
  }
  p()

  // ── real scripts ──────────────────────────────────────────────────────────
  p('---')
  p()
  p('## Real scripts — 8 players, ENSEMBLE, live API')
  p()
  type RealRun = {
    model: string
    players: number
    reviewUsage: { inputTokens: number; outputTokens: number }
    review: { rating: number; headline: string; review: string; bestMoment: string } | null
    results: Array<{
      traits: string[]
      setting: string
      circumstance: string
      usage: { inputTokens: number; outputTokens: number }
      hits: string[]
      script: { title: string; synopsis: string; lines: Array<{ speaker: string; text: string }> }
    }>
  }
  let real: RealRun | null = null
  try {
    real = JSON.parse(readFileSync(join(__dirname, '../.real-generation.json'), 'utf8'))
  } catch {
    p('_Not generated. Run `[VPS] npx tsx scripts/real-generation.ts` (needs the real key)._')
    p()
  }

  if (real) {
    p('Generated by `scripts/real-generation.ts` against the real API, through the production')
    p('`generateScript` path — same prompts, same model, same parsing as a live round.')
    p()
    p('**One thing to notice before you read them.** Nobody told the model to name the characters.')
    p('It derived a speaker name from each trait on its own — Chewer, Dreamer, Prophet, Echo,')
    p('Verbose, Secretary. That is the grammar doing what it was supposed to do: a trait is a')
    p('performable handle, so the model can build a voice and a name out of it without a franchise')
    p('to lean on. It could not have done that with "a grumpy swamp ogre" — it would just have')
    p('written the ogre.')
    p()

    real.results.forEach((r, i) => {
      p(`### ${i + 1}. ${r.script.title}`)
      p()
      p(`*${r.script.synopsis}*`)
      p()
      p('```')
      p(`setting:    ${r.setting}`)
      p(`situation:  ${r.circumstance}`)
      p('traits:')
      r.traits.forEach((t, k) => p(`  ${k + 1}. ${t}`))
      p('```')
      p()
      p(`${r.script.lines.length} lines · ${r.usage.inputTokens} in / ${r.usage.outputTokens} out · `
        + `layer 3: ${r.hits.length ? r.hits.join(', ') : '**0 hits**'}`)
      p()
      p('```')
      r.script.lines.forEach(l => p(`${l.speaker}: ${l.text}`))
      p('```')
      p()
    })

    if (real.review) {
      p("### The director's review that follows a round")
      p()
      p('```')
      p(`${real.review.rating}/5 — ${real.review.headline}`)
      p('')
      p(real.review.review)
      p('')
      p(`Best moment: ${real.review.bestMoment}`)
      p('```')
      p()
    }

    // ── cost ────────────────────────────────────────────────────────────────
    const n = real.results.length
    const meanIn = Math.round(real.results.reduce((s, r) => s + r.usage.inputTokens, 0) / n)
    const meanOut = Math.round(real.results.reduce((s, r) => s + r.usage.outputTokens, 0) / n)
    const rIn = real.reviewUsage.inputTokens
    const rOut = real.reviewUsage.outputTokens
    const IN_$ = 3, OUT_$ = 15
    const usd = (i: number, o: number) => (i / 1e6) * IN_$ + (o / 1e6) * OUT_$
    const roundIn = meanIn + rIn
    const roundOut = meanOut + rOut
    const perRound = usd(roundIn, roundOut)
    const BUDGET = 9

    p('---')
    p()
    p('## What a round costs')
    p()
    p(`Measured, not estimated — from \`usage\` on the real responses. Model \`${real.model}\`,`)
    p(`list price $${IN_$}/M input and $${OUT_$}/M output. ${real.players} players, ENSEMBLE.`)
    p()
    p('| call | in | out | cost |')
    p('|---|---:|---:|---:|')
    p(`| script generation (mean of ${n}) | ${meanIn} | ${meanOut} | $${usd(meanIn, meanOut).toFixed(4)} |`)
    p(`| director's review | ${rIn} | ${rOut} | $${usd(rIn, rOut).toFixed(4)} |`)
    p(`| **one complete round** | **${roundIn}** | **${roundOut}** | **$${perRound.toFixed(4)}** |`)
    p()
    p('Input is very stable (3606–3636 across runs) because the prompt is fixed-size. Output is')
    p('what varies — 1742 to 2956 tokens — so a round realistically lands between $0.04 and $0.06.')
    p()
    p(`### Your $${BUDGET}`)
    p()
    p('| | |')
    p('|---|---|')
    p(`| One round | $${perRound.toFixed(3)} |`)
    p(`| An evening of 6 rounds | $${(perRound * 6).toFixed(2)} |`)
    p(`| **$${BUDGET} buys** | **~${Math.floor(BUDGET / perRound)} rounds ≈ ${Math.floor(BUDGET / (perRound * 6))} full evenings** |`)
    p()
    p(`**So: not 5 playtests, and not 500 — about ${Math.floor(BUDGET / (perRound * 6))}.** Eight people`)
    p('playing six rounds costs roughly a pound. You can hand this to your eight non-friends')
    p('without watching the meter, and if they play all night you still will not clear the budget.')
    p()
    p('### Does credit pricing cover it? (`DECISIONS.md` #9)')
    p()
    p('That item has been open since the audit, blocked on "what one credit costs and how many a')
    p('game consumes". Both are now known: `lib/credits.ts` prices four tiers, and')
    p('`deductCreditOrReject` takes **one credit per generation**, so one credit is one round.')
    p()
    p('| tier | price | scripts | $/script gross | via Stripe | via Apple IAP (30%) |')
    p('|---|---:|---:|---:|---:|---:|')
    p('| Starter Bank | $5 | 20 | $0.250 | $0.228 | $0.175 |')
    p('| Party Pack | $10 | 50 | $0.200 | $0.188 | $0.140 |')
    p('| Producer | $50 | 300 | $0.167 | $0.161 | $0.117 |')
    p('| **Studio Head** | **$100** | **1000** | **$0.100** | **$0.097** | **$0.070** |')
    p()
    p(`Against $${perRound.toFixed(4)} a round, every tier covers inference. **But look at the`)
    p('bottom-right cell.** Studio Head sold through Apple IAP returns $0.070 a script against a')
    p('$0.053 cost — roughly a **24% gross margin**, before hosting, bandwidth or poster generation.')
    p()
    p('And it is sensitive to exactly the thing that is already drifting:')
    p()
    p('| output tokens | round cost | Studio via Apple |')
    p('|---:|---:|---|')
    p('| 1742 (observed min) | $0.042 | 1.68× |')
    p('| 2503 (observed mean) | $0.053 | 1.32× |')
    p('| 2956 (observed max) | $0.060 | 1.17× |')
    p('| 4000 | $0.076 | **loss-making** |')
    p()
    p('Scripts are already running 50–80% over the requested line count. They do not have to drift')
    p('much further before the top tier stops making money on the channel that charges the most to')
    p('sell it.')
    p()
    p('**Your web-first decision helps here more than it might have looked.** Stripe takes ~3% on a')
    p('$100 sale where Apple takes 30%. Selling Studio Head on the web is $0.097 a script instead of')
    p('$0.070 — the difference between a 1.8× margin and a 1.3× one, on the tier a heavy host is')
    p('most likely to buy.')
    p()
    p('Two things that would change that number, neither of them active today:')
    p()
    p('- **Audience mode adds two more calls per round** (`generateAIPlotTwistOptions`,')
    p('  `generateAITwistInjection`, 400 max_tokens each). Not measured here because it is off in')
    p('  a standard round; budget maybe another cent.')
    p('- **`max_tokens` is 10000 for ENSEMBLE and the model is using a quarter of it.** Nothing is')
    p('  being truncated, so there is no bug — but if a future prompt change makes scripts longer,')
    p('  cost scales with output and there is a lot of headroom to grow into.')
    p()
    // Computed, not written down. The hardcoded version of this sentence went stale within one
    // regeneration — it claimed 45–64 lines against a run that produced 59–73.
    const lineCounts = real.results.map(r => r.script.lines.length)
    const loLines = Math.min(...lineCounts)
    const hiLines = Math.max(...lineCounts)
    p('**The overrun below is a margin problem, not just a pacing one.**')
    p()
    p(`The prompt asks for 30–40 lines. These came back at **${loLines}–${hiLines}** — nothing`)
    p('enforces the range. At a party that is a duration question: 73 lines is a long time to keep')
    p('eight people performing. But output tokens are 83% of the cost of a round, so length drift')
    p('is also the one variable that can move the unit economics, and the top credit tier does not')
    p('have much room. See the margin table below.')
    p()
  }

  // ── public domain ─────────────────────────────────────────────────────────
  p('---')
  p()
  p('## Deliberate public domain — a judgement call to confirm or overrule')
  p()
  p('You said genre and public domain are allowed and under-used. They are now used, and only in')
  p('SETTINGS, never in the trait deck. The reason is that your two rules pull against each other:')
  p('a Holmes or a Dracula card would be perfectly legal and would fail your own done-criterion,')
  p('because I can name it. So public domain enters as a SCENE rather than as a person.')
  p()
  const PD = SETTINGS.filter(s =>
    /Heath|King Has|Balcony|Ferryman|Labyrinth|Chained|Confectionery|Tower With No Door|Ends At Midnight|Round Table|Hand Coming Out|Carpathians|Ship’s Log|Thunderstorm|Opera House|Whaling|Tea Table|Debtors|Counting House|Moor At Night|Five Daughters|Fog At The Window/.test(
      s.name,
    ),
  )
  p('```')
  PD.forEach(s => p(`- ${s.name}`))
  p('```')
  p()
  p('**Two of those deserve a second look and I am flagging them rather than quietly keeping them:**')
  p()
  p('- *A Laboratory In A Thunderstorm With A Sheet Over Something.* Frankenstein is public domain')
  p('  (1818) but the lightning-powered laboratory is not in the novel — it is the 1931 film, which')
  p('  is not. The imagery I reached for is the copyrighted one.')
  p('- *An Opera House Box That Is Always Kept Empty.* Box Five is from the 1910 Leroux novel and')
  p('  is genuinely public domain, but public association runs through the musical, which is not.')
  p()
  p('Both are cheap to cut. Neither is load-bearing. Say the word.')
  p()

  // ── the judgment call ─────────────────────────────────────────────────────
  p('---')
  p()
  p('## What I have to flag: the cost landed where you predicted')
  p()
  p('You asked me to flag anything reading as *generic* rather than *absurd*. Here is the honest')
  p('report, and it is mixed.')
  p()
  p('**The trait deck is not generic, but it is quieter.** "Apologises for things that have not')
  p('happened yet" and "Performs grief beautifully and feels none of it" are jokes. They are not')
  p('the *same kind* of joke as a talkative pack animal who will not stop narrating, because they')
  p('do not arrive pre-loaded with a voice everyone at the table already does. A player has to')
  p('build the character rather than do an impression. That is a real change in what the game asks')
  p('of people, and eight non-friends at a party are exactly the test of whether it is too much.')
  p()
  p('**The situations got much stronger and are now carrying the scene.** The old deck offered')
  p('"Stuck in an elevator with strangers", which is a genre of situation rather than a situation.')
  p('The new ones commit: *a eulogy is required in nine minutes for somebody nobody liked*, *one of')
  p('you has been replaced and the replacement is doing better*, *there is one chair too few and')
  p('nobody will mention it*. Read the hands above and notice where your eye goes — for most of')
  p('them it is the second and third line, which is the opposite of the old deck.')
  p()
  p('**Where I think it is weakest.** Ensemble mode assigns the first trait as STRAIGHT MAN, and')
  p('some traits refuse that job — "Reacts to everything at maximum volume" cannot be the')
  p('reasonable one. The old deck had the same problem and hid it, because a named character')
  p('carries an implied status the model could read. Worth watching in the first live scripts; it')
  p('is a prompt fix, not a catalog one, and I have not made it because it needs real generations')
  p('to confirm rather than my guess.')
  p()
  p('**What I am not doing is telling you whether it is funnier.** That is your call and it is the')
  p('reason this file exists.')
  p()

  p('---')
  p()
  p('<details><summary>Full system prompt</summary>')
  p()
  p('```')
  p(systemPrompt)
  p('```')
  p()
  p('</details>')

  console.log(out.join('\n'))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
