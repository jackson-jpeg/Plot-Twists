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
 * WHAT IS MISSING, AND WHY. Three complete generated scripts were asked for and are NOT here.
 * There is no ANTHROPIC_API_KEY on this box or in /etc/plotslop/env, so a real script cannot be
 * generated, and the harness mock returns deterministic filler that would say nothing about
 * comedy. Printing that under the heading "generated script" would be worse than printing nothing.
 */

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
  p('**Three complete generated scripts were asked for and are not here.** There is no')
  p('`ANTHROPIC_API_KEY` on this box or in `/etc/plotslop/env`, so no real script can be')
  p('generated; the harness mock returns deterministic filler that would say nothing about')
  p('comedy. **This is blocked on the same key the deploy is blocked on.**')
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
