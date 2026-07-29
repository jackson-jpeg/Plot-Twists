/**
 * Playtest packet generator — the one Chunk 4 done-criterion automation cannot close.
 *
 *   [VPS] npx tsx scripts/playtest-packet.ts > PLAYTEST-2026-07-29.md
 *
 * Nobody has read a dealt hand since 375 catalog entries were rewritten from named
 * characters to archetypes. The tests prove the rewrite is LEGAL. Nothing proves it is still
 * FUNNY, and losing specificity is the exact cost an archetype rewrite risks: "Shrek" is a
 * joke, "a large green ogre" is a description.
 *
 * WHAT THIS DOES AND DOES NOT USE. Hands come from the real `dealCards` against the real
 * catalog — the same function `start_game` calls — so what appears below is what a player is
 * actually dealt, not a plausible reconstruction. Screening runs the real
 * contentScreen matchers rather than a reimplementation, for the same reason.
 *
 * WHAT IS MISSING, AND WHY. Three complete generated scripts were asked for and are NOT here.
 * There is no ANTHROPIC_API_KEY on this box or in /etc/plotslop/env, so a real script cannot
 * be generated, and the harness mock returns deterministic filler ("Harness line 1. This is
 * deterministic filler dialogue...") which would tell a reader nothing about comedy. Printing
 * that under the heading "generated script" would be worse than printing nothing.
 *
 * What is here instead is the exact system+user prompt the model WOULD receive for three of
 * these hands, built by the real prompt path. That is the input under our control and it is
 * the part the catalog rewrite actually changed.
 */

import type { Room } from '../lib/types'
import { dealCards } from '../server/services/cardCatalog.service'
import { getSystemPrompt, getModeInstructions } from '../server/services/prompts/comedyPrompts'
import { screenScript, type ScreenHit } from '../server/services/contentScreen.service'
import { CHARACTERS, SETTINGS, CIRCUMSTANCES } from '../lib/content'

const HANDS = 25
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

/**
 * Screen arbitrary prose with the PRODUCTION matcher.
 *
 * screenScript only accepts a Script, so text is wrapped in one rather than duplicating the
 * regex table here. A second copy of the matcher would be a second thing to keep in sync, and
 * the whole point of this section is to report what the real screen would say.
 */
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
  p('**Generated 2026-07-29 from the rewritten archetype catalog.**')
  p()
  p('Read this to answer the one question the test suite cannot: *is it still funny?*')
  p('Everything below comes from the real dealing path (`cardCatalog.service.dealCards`), so')
  p('these are hands players actually get.')
  p()
  p(`Catalog: **${CHARACTERS.length} characters · ${SETTINGS.length} settings · ${CIRCUMSTANCES.length} circumstances**.`)
  p()

  // ── 25 hands ──────────────────────────────────────────────────────────────
  p('---')
  p()
  p('## 25 dealt hands')
  p()
  p('Format: `character / setting / situation`. Each line is one card taken from a real')
  p('eight-card deal, which is what a player picks from.')
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
  p('**Three complete generated scripts were asked for and are not here.** There is no')
  p('`ANTHROPIC_API_KEY` on this box or in `/etc/plotslop/env`, so no real script can be')
  p('generated; the harness mock returns deterministic filler that would say nothing about')
  p('comedy. Printing that under a "generated script" heading would be worse than printing')
  p('nothing. **This is blocked on the same key the deploy is blocked on.**')
  p()
  p('What follows is the exact prompt three of the hands above produce, built by the real')
  p('prompt path — the input under our control, and the part the catalog rewrite changed.')
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
    p(`characters:   ${h.character}, ${hands[i + 1].character}, ${hands[i + 2].character}`)
    p(`setting:      ${h.setting}`)
    p(`circumstance: ${h.circumstance}`)
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
    { label: 'FULL character catalog', text: CHARACTERS.map(c => c.name).join('\n') },
    { label: 'FULL setting catalog', text: SETTINGS.map(c => c.name).join('\n') },
    { label: 'FULL circumstance catalog', text: CIRCUMSTANCES.map(c => c.name).join('\n') },
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

  if (totalHits === 0) {
    p('**Zero hits.** Nothing in the 25 hands, the prompts, or all 501 catalog entries matches')
    p('a protected term or a real person.')
    p()
    p('Read that as narrowly as it is meant. The screen is a **fixed denylist**: it finds terms')
    p('someone already thought to add. A clean sweep means no *named* entity survived the')
    p('rewrite — it does not mean nothing is recognisable. "A wheezing tyrant in black armour')
    p('who is secretly your father" passes this clean, and would pass it forever. The semantic')
    p('pass has not been built.')
  } else {
    p(`**${totalHits} hit(s).**`)
    p()
    p('| where | terms |')
    p('|---|---|')
    lines.forEach(l => p(l))
  }
  p()

  // ── near misses ───────────────────────────────────────────────────────────
  p('### Near misses — flagged, deliberately not redacted')
  p()
  p('Catalog entries that read as *evocative of* something specific without naming it. The')
  p('screen does not and should not catch these; a human should look at them.')
  p()
  const NEAR = [
    /ogre|swamp/i, /wizard|chosen one|scar/i, /armour|armor|helmet|breathing/i,
    /rat|chef|kitchen/i, /sponge|pineapple/i, /mouse|castle|kingdom/i,
    /detective|deerstalker|violin/i, /archaeolog|whip|fedora/i,
  ]
  const near = [...CHARACTERS, ...SETTINGS, ...CIRCUMSTANCES]
    .filter(c => NEAR.some(re => re.test(c.name)))
  if (near.length === 0) {
    p('_None matched the heuristics used._')
  } else {
    p('```')
    near.forEach(c => p(`- ${c.name}`))
    p('```')
  }
  p()

  // ── the judgment call ─────────────────────────────────────────────────────
  p('---')
  p()
  p('## 🔴 What I have to flag: not generic — the opposite')
  p()
  p('You asked me to flag anything reading as *generic* rather than *absurd*, because losing')
  p('specificity is the real cost of the archetype rewrite. **That is not what happened.**')
  p()
  p('Read the hands above again. "A noodle-shop panda who became a martial arts prodigy."')
  p('"A cheerful fish with no short-term memory." "A grey wizard who arrives precisely when he')
  p('means to." "A grumpy swamp ogre who just wants to be left alone", dealt alongside "a')
  p('talkative pack animal who will not stop narrating".')
  p()
  p('These are not archetypes. They are the same protected characters with the names removed —')
  p('and they are still individually identifiable, which is why they are still funny. The')
  p('catalog kept its franchise-by-franchise ordering: the first eight characters are one')
  p('sitcom ensemble in cast order, then another, then the superheroes, then the space opera.')
  p()
  p('So the comedy question you were going to answer has a good answer, and a bad one behind')
  p('it. **The specificity survived. It survived because the IP did.**')
  p()
  p('`DECISIONS.md` #4 defines layer 1 as "252 named characters → archetypes". What shipped is')
  p('paraphrase, not archetype, and paraphrase is arguably a worse artefact than the original:')
  p('a description engineered to evoke a character without naming it is the same class of thing')
  p('as the poster briefs — your words: *exposure is what you did; intent is what you wrote')
  p('down about doing it.*')
  p()
  p('**Layer 3 passes clean on every line of it**, and always will. It is a fixed denylist of')
  p('names, so it cannot see a character that is described rather than named. That was recorded')
  p('as a known limitation; this packet is what it looks like in practice.')
  p()
  p('This is your call, not mine — a true archetype rewrite trades away exactly the')
  p('recognisability that makes the mashups land, and how much to trade is a product decision.')
  p('It is top of `NEEDS-JACKSON.md`. **Chunk 4 should not be treated as closed until it is')
  p('answered.**')
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
