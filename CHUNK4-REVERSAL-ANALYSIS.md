# Chunk 4, reconsidered

**Three questions, answered in the order you asked them: what reversal costs, what is wrong with the design, and whether it is funnier.**

Written 2026-07-30. Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

The blind packet is a separate file — **`AB-PACKET.md`**, pushed to `~/Downloads`. Read that
first if you are going to read it at all. My own read is at the very end of this file, behind a
marker, because you asked for the packet to carry no commentary and it does not.

---

## The short version

1. **Reversal costs about five to six sessions, not a revert.** The catalog is the cheap third of
   it. The expensive part is that layer 2's central invariant has to be negated and replaced, and
   that "anything leaving the room renders archetypes only" is not a rendering rule — it is a
   guarantee that has to hold at **nine** separate egress points, one of which is model-written
   prose.
2. **Reversing is not a mistake in principle.** Your design's IP posture is genuinely better than
   the pre-Chunk-4 catalog, and I would say so even though I built the thing it replaces. But the
   *cheap* version of the reversal does not exist, and I can show you why with six samples rather
   than an argument.
3. **The strongest argument against is not legal.** It is that the comedy becomes a function of
   what the room has watched, and your next commitment is eight people who are not your friends.
4. **Short names do not recover the +37.5%.** Measured: they recover **21%** of it. The increase
   was mostly the line budget, not the labels.
5. **The A/B is generated, 14 scripts, $0.6957.** Six blind pairs plus two attack runs.

---

# 1. Cost of reversal, layer by layer

Sessions, not reassurance. Every number below is from the repo or from the run, not from memory.

## 4a — the poster briefs and the six bundled assets

`8c1ca476` (web) + `e24f8dee` (iOS): `lib/homepagePosterBriefs.ts` (248 lines),
`scripts/generate-homepage-posters.ts` (121 lines), six PNGs (~11 MB), the manifest, and the six
iOS catalog entries.

**Permanently valuable, under every design including yours. Cost to reverse: zero, because
nothing about your design wants it back.** The design ships slots and never names, so there is no
artefact in it that needs written instructions for rendering a named character. And as of last
night there is no image pipeline behind the homepage at all — the cards are typographic.

Worth being explicit, because it is the one place the two designs look similar and are not: those
six posters were crossovers of named characters, which is exactly what your design lets a *player*
make in-room. The difference is that one is ephemeral and private and the other was marketing
collateral on the front page. Reversal does not touch 4a and should not.

## Layer 2 — server-side ID resolution

`5b383321`: `cardCatalog.service.ts` (205 lines), `validation.ts` (+41), `lib/types.ts` (+49),
`selection.handler.ts` (+51), `CardPicker.tsx` (94 lines changed), `selectionStore.ts` (+27), and
13 tests.

**This is the layer your design contradicts, and the contradiction is exact.** The invariant is
written at the top of the file:

> Every string in a `CardSelection` is a value the server read out of its own catalog. No byte of
> `submit_cards` input is ever interpolated into a prompt, stored in gameHistory, or rendered on
> the results screen.

Your design requires a player-typed name to reach the model. That is not a modification of the
invariant; it is its negation.

| | |
|---|---|
| **Survives untouched** | The ID path for **settings and circumstances** — two of the three slots, and the two carrying the specificity budget. `getRoomCatalog`, `dealCards`, `toSelectedCards`, the fail-closed fallback, the 13 tests minus a few. The category slot is still an ID. |
| **Comes back** | Free text on the wire. `CardSelectionInput` widens from three IDs to `{ characterSlotId, characterName }`. `CardPicker.tsx` gets its custom-input mode back — layer 2 deleted `maxCustomLength`, `customMode`, `toggleCustom` and the input branch, and they return nearly verbatim. |
| **Genuinely new, and the part that is easy to under-scope** | A name field needs validation that does not exist anywhere in this repo. Length, character class, prompt-injection payloads, slurs, and the fact that a "name" is now the one string a player controls that reaches a paid model. **Layer 2 gets all of that for free today by never accepting text at all.** You do not get to carry "we validate IDs" over as "we validate names" — different problem, no shared code. |

**≈2.5 sessions.** One to widen the wire format and restore the picker, one for name validation
worth having, half for tests.

## Layer 3 — output screening

`contentScreen.service.ts` (147 lines), `lib/protectedTerms.ts` (312 lines, 258 terms), 19 tests.

**Layer 3 does not survive reversal in its current orientation, and this is measured rather than
predicted.** Today it answers *"did the model volunteer IP nobody asked for?"* Under your design,
IP in the output is expected — the player put it there. Pointing an unchanged screen at that
produces this, in **4 of the 6 arm-B runs**:

```
before: "Ross Geller must fairly distribute two cakes among eight workers while everyone
         pursues their own cake-related agenda and nobody agrees on basic math."

after:  "someone you would recognise must fairly distribute two cakes among eight workers
         while everyone pursues their own cake-related agenda and nobody agrees on basic math."
```

And once in a punchline, where it also breaks the grammar:

```
before: BATMAN — "Homer Simpson's team wins."
after:  BATMAN — "someone you would recognise's team wins."
```

That is not a bug in the screen. It is the screen working correctly on input it was not designed
for. Production emits the *screened* script — `server/handlers/game.helpers.ts:151` and
`game.handler.ts:306` — so this is what would ship, not what a test would catch.

One more thing it does, which is its own argument: it redacted **Sherlock Holmes**, who is public
domain. Under your design Holmes is a legal, desirable pick. Under the current screen he is
redacted.

| | |
|---|---|
| **Survives** | The matcher machinery, whole. The precision-over-recall design, the false-positive corpus (`Die Hard` fires on "old habits die hard"; `Rapunzel` is Grimm), the purity guarantee, the room-code-and-timestamp logging. ~100% of the mechanics. |
| **Must be built** | The design says *"anything leaving the room renders archetypes only."* That is a **boundary**, not a screen, and it has to hold at nine places: the replay page, the replay OG image, the clip card, the character card, `/clips`, `/digest`, `/review/[code]`, persisted `gameHistory` (which stores `character:` per player and prints `${p.character} ............ ${p.nickname}`), and `formatScriptAsText` — the copy-to-clipboard the player controls entirely. |

**≈2.5 sessions.** Half to repoint the screen; two for the egress boundary, which has the most
surface and the least glamour in the whole reversal.

## Layer 1 — the catalog

`06440ee7`: `scripts/build-catalog.ts` (951 lines) generating `lib/content.ts` (694 lines).
**509 entries: 251 characters, 125 settings, 133 circumstances.** 18 tests in
`contentSource.test.ts`.

**This is the layer everyone thinks is the reversal, and it is the cheapest third of it.**

- **258 of the 509 entries — the settings and circumstances — are untouched and are the best
  thing in the deck.** *A Castle At The Top Of A Very Long Staircase In The Carpathians.* *There
  is a second cake.* They carry the specificity budget under either design and they are not
  IP-constrained. Nothing about your proposal wants them changed.
- **The generator survives.** Seeded shuffle, derived tags, derived IDs, the adjacency gate. A
  category deck is authored the same way and gets the same guarantees for free.
- **251 trait entries are a write-off,** along with the human done-criterion run against them.
- Of the 18 `contentSource` tests, the grammar and ordering ones go with the traits; the "no
  franchise title in a comment" ones survive and **get more important**, not less — see the
  incident in §3 where that gate caught me.

**≈1 session** to author a category deck and regenerate.

## The cast binder — not Chunk 4, and I should say so

`scriptCast.service.ts` came from the line-budget pass (`7993c88c`), not from Chunk 4. It is
**100% preserved and it gets easier**: it snaps a model-emitted speaker onto a seated player, and
short distinctive names snap more cleanly than 45-character sentences.

Measured across the experiment: the trait arm produced **zero** off-cast speakers in six scripts;
the name arm produced **one** (`Everyone`, in the portacabin scene). So the machinery holds
either way, and the binder is not a cost of reversal in any direction.

The same is true of last night's speaker-label work — **with one exception that is actually an
argument, and it is in §2.**

## The 540 tests

They are not 540 tests about Chunk 4. Decomposed:

| Suite | Tests | Fate under reversal |
|---|---:|---|
| `contentSource.test.ts` | 18 | ~12 die with the trait deck; the comment/prompt-source gates survive and matter more |
| `cardCatalog.service.test.ts` | 13 | Most survive — settings and circumstances are unchanged |
| `contentScreen.service.test.ts` | 19 | Survive as machinery tests; the *application* is what moves |
| `comedyPrompts.cast.test.ts` | 14 | Survive; the cast block changes shape, not purpose |
| `scriptCast.service.test.ts` | 21 | Untouched — not Chunk 4 |
| `speakerLabel.test.ts` | 23 | Untouched — not Chunk 4 |
| everything else | 432 | Untouched |

**Realistic write-off: ~25 tests.** Not 540. The number in your question was the scariest one
available and it is off by a factor of twenty.

## Total, and the plain answer you asked for

**≈6 sessions.** 2.5 (layer 2) + 2.5 (layer 3 boundary) + 1 (catalog). 4a costs nothing, the
binder costs nothing, and the settings and circumstances survive whole.

**Do I think reversing is a mistake? No — but the version of it that is cheap does not exist,
and that is the finding.**

Your design's IP posture is genuinely better than what stood before Chunk 4, and I will say that
plainly even though I built the thing it replaced. A private room where a player types a name is
a different legal object from a shipped catalog of 252 named characters; the first is
user-generated content and the second is a product decision with your name on it. That is not a
small difference and it is the strongest thing about your proposal.

What I do not believe is the sentence *"anything leaving the room renders archetypes only."* Not
because you would not mean it, but because a third of what leaves the room is prose the model
wrote, and you cannot render a name out of *"Ross Geller must fairly distribute two cakes"*
without either shipping *"someone you would recognise must fairly distribute two cakes"* or
paying for a second generation. I have six samples of the first option. It reads exactly as bad
as it looks.

**So: reverse if the packet says it is funnier. Do not reverse for the IP reason, because the
containment is a nine-point boundary rather than the one-line rule it sounds like, and do not
reverse for cost, because cost moves 6%.**

---

# 2. Attacking the design

You asked for the strongest argument against, not a list of mitigations. Here it is, and then
your three specific questions.

## The strongest argument against: the comedy becomes a property of the room, not of the game

Under the trait deck, the game supplies the joke. *Interprets all silence as agreement* is funny
to eight strangers because the trait is legible on sight and the humour is constructed in front
of them.

Under the category design, the joke is **recognition**, and recognition is not something the game
owns. It is something the room either has or does not.

This is visible in the numbers before you read a word of the packet:

| | trait arm | name arm |
|---|---:|---:|
| words per line | **7.24** | **6.43** |
| words in the sparsest script | 297 | **208** |

**The model writes less when you give it names, because the name is doing work the writing no
longer has to do.** In pair 1 the name arm produced a fifty-line script in 208 words — 4.2 words
per line. Lines like `Mmmm, crust.` and `Hmm!` are funny if and only if you brought Homer Simpson
and Mr. Bean with you. They are nothing on the page.

That is a fine trade at a party of friends. **Your next commitment is a playtest with eight
people who are not your friends.** The design's quality is highest exactly where you have already
proven the product works, and lowest exactly where you have not.

And the second-order version is worse: it is unmeasurable. Which brings us to your first question.

## "One obscure pick against seven from the same show"

I ran both halves rather than reasoning about them. Two extra arm-B generations, deliberately
kept **out** of the blind packet so they could not distort a taste test.

**The clustered cast** — seven from one show, one from outside it:

```
per-seat lines   7/6/7/8/6/6/6/6      off-cast 0      below floor 0
```

That is **the most even distribution in the entire experiment**, arm A included. The model
handled it perfectly. Nobody was starved, nobody was invented, the line budget held.

**Read that again, because it is the actual finding.** The failure mode you named is real, and it
is *invisible to every instrument in this codebase*. The `Cast binding` distribution logging you
are about to run against tonight's playtest would score that round as the healthiest of the
evening. Seven players performing an in-joke and one player performing alone produces a perfect
telemetry line.

The trait deck cannot produce that failure at all, because there is no shared reference to
cluster on. This is not a mitigation problem. It is a class of defect the design admits and the
measurement cannot see.

**The obscure cast** — eight picks with no shared reference — produced the second finding, and it
is the one I would put in front of a lawyer:

```
layer 3 hits:  famous casts  →  22, 24, 31, 32, 33, 41   (mean ~30 per script)
               obscure cast  →  0
```

**Layer 3's sensitivity is a measure of how famous the pick is.** It fires hardest on the rounds
where the comedy is working and goes completely silent on the rounds where it is not. Under your
design the screen stops being a risk detector and becomes a **popularity detector** — and a
control that punishes your best rounds and ignores your worst is a control somebody switches off
within a month. That is not a hypothetical failure of discipline; it is what the incentive
structure of that control actually is.

## "Whether short names recover the +37.5%"

**No. They recover 21% of it.** Measured over six runs each, same scenes, same everything:

| | mean input | mean output | per round |
|---|---:|---:|---:|
| trait arm | 4,911 | 2,443 | **$0.0514** |
| name arm | 4,871 | 2,246 | **$0.0483** |

Names are **6.0% cheaper** per round. The increase you are trying to claw back was $0.0400 →
$0.0550, or $0.0150. Names return $0.0031 of it — **about a fifth**.

The reason is that I mis-attributed the increase when I reported it, and this corrects that: the
+37.5% was **mostly the line budget**, not the labels. Scripts went from 37.7 lines to 51.3, which
is +36% of output on its own. The cast label costs roughly 7 output tokens per line and the mean
label went from 39.3 characters to 10.9 — real, and swamped. **No change to the labels can recover
a cost that was never in the labels.** If you want the money back, the lever is the line budget,
and you decided that band deliberately.

## "Whether the category deck can carry it, and what a bad category looks like"

**It cannot carry it, and the reason is arithmetic rather than authoring.**

| deck | entries | seats | hands deep |
|---|---:|---:|---:|
| trait deck (today) | 251 | 8 | **31×** |
| settings | 125 | 8 | 16× |
| circumstances | 133 | 8 | 17× |
| a category deck | ~25 | 8 | **~3×** |

A genuinely distinct list of genre categories is small. Not because nobody has written a big one,
but because there are only so many *registers* in the English-speaking world: a horror villain, a
Disney sidekick, a prestige-TV antihero, a 90s sitcom character, a video-game protagonist. Push
past about twenty-five and you are inventing sub-genres nobody can fill.

So the deck that replaces 251 traits is roughly **eight times shallower**, and at eight seats it
collides on nearly every deal. Two players draw "a sitcom character" and both type from whatever
they watched last night — which is the clustering failure again, arriving through the deck rather
than through the room.

**And this is where the design collides with what shipped last night.** The replay page, the
share card and the digest have to render archetypes only. Under the trait deck that works: 251
unique strings, and a shortest-unique-prefix algorithm exists to shorten them without ever
letting two players share a label. Under the category deck the labels are **not unique by
construction** — the clustered cast has seven seats reading `a sitcom character`. The public
replay of that round is seven identical speaker names and an unreadable script.

That is the sharpest structural problem in the proposal: **the property that makes it defensible
outside the room is the property that destroys the artefact people share.** The name is unique
and cannot leave; the category can leave and is not unique.

### What a bad category looks like

Three shapes, and two of them are tempting:

1. **Too broad** — *"a movie character"*. No constraint, so it is a blank text box with extra
   steps, and eight unrelated picks arrive with no comic relationship to each other.
2. **Too narrow** — *"a 1990s British sitcom character"*. Half the room cannot fill it and the
   half that can all name the same person. Narrow categories *cause* clustering rather than
   preventing it.
3. **Not a comedy axis at all** — *"a character from a film released after 2015"*. This is the
   subtle one. A category earns its place by implying a **register**: a horror villain is
   deadpan-menacing, a Disney sidekick is manic-loyal, an antihero is self-justifying. The
   register is what collides funnily with *A Village Hall Quiz At The Tie-Break*. A category that
   is a metadata filter rather than a register produces eight characters who have nothing to play
   against.

Good categories are the ones that name a register. There are about twenty of those. That is your
deck size, and it is the number the arithmetic above is built on.

## One argument *for* the design that I did not expect, and should record

Writing the experiment forced me into the design's own discipline, and it worked.

The A/B needs sixty named characters. Committing them would have reproduced 4a's artefact with a
different job title — *"exposure is what you did, intent is what you wrote down about doing it."*
So the casts live in `.ab-casts.json`, which is gitignored, and `scripts/ab-generation.ts` — the
committed half — contains the harness and **no names at all**.

That is your design, rehearsed at small scale, and it held. The slot ships; the name does not.
It is genuinely a point in favour, and I would rather tell you that than pretend the case is
one-sided.

---

# 3. Is it funnier?

## What was run

**14 generations against the real API. $0.6957 total.** Six blind pairs plus two attack runs.

Within a pair, both arms get the same setting, the same circumstance, the same eight seats, the
same model, the same temperature, the same line budget, the same style settings, and the same
production `generateScript`. **The only difference is the cast.**

Arm A is the product, not a replica of it: `castStyle` defaults to today's behaviour, and
`comedyPrompts.cast.test.ts` asserts the default is **byte-identical** to the un-parameterised
call across all three modes and both maturity ratings. It also asserts the `'name'` branch really
differs — otherwise the experiment would have compared an arm against itself, which is the exact
shape of the 4.71-vs-0.00 error from this morning.

**What the blinding does and does not buy, stated plainly.** The arms are distinguishable on
sight: one has sentences for speaker names, the other has proper nouns. Nothing can hide that,
because it *is* the change. What the blinding removes is the thing that actually biases a read —
knowing which one is the incumbent and which one the person who prepared the packet wants to win.
A and B are consistent across all six pairs, the assignment is a fixed 3/3 split, and the key is
in `.ab-key.json`, which the packet generator writes and never reads.

Where a rendering choice was arguable I made it in favour of the arm I did not build: the trait
arm is shown with the **full** trait rather than the shipped short label, because a reader has no
card in their hand to match a prefix against.

## The objective measurements

Not funniness. Everything about the two arms that a machine can actually settle.

| | trait arm | name arm |
|---|---:|---:|
| lines per script | 51.5 | 52.0 |
| **words per line** | **7.24** | **6.43** |
| median lines per seat | 6 | 6 |
| lowest any seat got, across 6 scripts | **4** | **3** |
| seats below the 3-line floor | 0 | 0 |
| **invented speakers nobody could read** | **0** | **1** |
| **layer 3 hits per script** | **0** | **~30** |
| **synopses that would ship redacted** | **0 of 6** | **4 of 6** |
| cost per round | $0.0514 | $0.0483 |

Both arms clear your acceptance bar. Neither starves anybody. The differences that are not noise
are **words per line**, **layer 3**, and **redacted synopses** — and all three point at the same
thing, which is that the name arm is importing something rather than making it.

## The packet

**`AB-PACKET.md`** — six pairs, twelve scripts, 621 lines. Roughly ten minutes, not five; I would
rather overshoot your budget than cut the sample to four pairs and hand you a coin toss.

A 3–3 split is a real result and the most useful one available: it prices the entire question at
zero and the freeze holds by default.

The packet is **not committed** — same reason as the casts. It is on your Mac.

---

<br><br><br>

## ⛔ STOP — read the packet before this section

<br><br><br>

### My own read, since you asked me to answer it myself

**Not a coin toss, and not the direction I expected to have to report.**

On the page, the name arm is faster and lands more often. Pair 1's name arm has the best single
run of jokes in the experiment — a grudge about lembas bread left on a stump, an "Let it go" /
"Don't say it" / "...go?" beat that is properly built, and a button (*"YOU SHALL NOT PASS. The
sandwich."*) that the trait arm has no equivalent of anywhere in six scripts.

But the trait arm's **best** scenes are better than the name arm's best scenes, and they are
better in a way that matters more for a product. Pair 5's trait script builds an original premise
out of nothing — a second cake, a man whose entire function is *solves it in the first minute and
is ignored*, and a final line (*"Technically, that IS combining them"*) that pays off a runner
planted forty lines earlier. Nothing in it is borrowed. Pair 1's trait script invents a 1987
napkin incident and then pulls the rug on it with a fake question.

So: **the name arm has the higher floor and the lower ceiling.** A name does character work the
writing does not have to do, which is why the sparsest script in the experiment is a name script
at 4.2 words per line — and why the name arm never produces a scene that is *about* anything. The
trait arm is more variable and occasionally builds something.

If the answer were mine to give: **the difference is not worth six sessions**, and it is
especially not worth six sessions before the playtest that would tell you whether the floor or
the ceiling is the thing that matters with strangers in the room.

But the answer is not mine to give. Tell me a letter and I will tell you which arm won.

The mapping was written to `.ab-key.json` **before** either of us read a line of the packet, by
the same script that rendered it, and the packet generator never reads that file back. If you
want to check I have not quietly rewritten it to agree with you, the file has a timestamp.
