# Session report — 2026-07-30, late evening

**The line budget, the per-character instruction, and a part that belonged to nobody.**

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = the Mac.

---

## What you asked for

> *"Line budget: apply 42-52, max_tokens 2,600 → 3,000. Approved. Also apply the per-character
> instruction now — don't wait for the playtest. The skew is already measured… I'd be spending
> eight real people to confirm what three generations showed. [1] A minimum line-share per seated
> character. No speaker below 3. [2] Exactly the seated cast, no invented characters. Then re-run
> three generations and report: median, range, and speaker count vs cast size. Acceptance is
> median >= 5 and no speaker below 3. If the prompt change costs quality — scenes get stiff or
> evenly boring — say so plainly and I'd rather have the skew. And apply the lesson from the
> invite card before you tell me it's done: curl every route this touches on the live site."*

All of it is applied, deployed, and passing. **Median 6, floor 4, zero invented characters.**

---

## The headline: your instinct was right, and it was worse than you thought

You said a ninth invented part is "a part nobody reads." That was true. It was also true of the
other eight.

`components/MobileTeleprompter.tsx:99` is the only thing in this product that binds a written part
to a person in the room:

```ts
const isMyTurn = currentLine.speaker === myCharacter
```

`myCharacter` is set in `stores/subscriptions.ts:159` from `selection.character.name` — **the
verbatim text of the trait card the player picked**, e.g. `Insists nothing is wrong at increasing
volume`. Meanwhile the prompt handed the model a list of traits next to an output format whose
example read `"speaker": "Character Name"`. So the model did the reasonable thing and invented
first names.

Measured across the three live generations from this morning: `Marcus`, `Denise`, `New Riley`,
`Paulo`, `Jen`, `Theo`, `Sandra`, `Ahmed`, `Kristy`…

**Zero of eight traits matched, in three scripts out of three. 113 of 113 lines belonged to
nobody. YOUR TURN has never fired for any player since the teleprompter was written.**

Two independent mechanisms, per rule 2.2: the code path read end-to-end (`subscriptions.ts` sets
it, `MobileTeleprompter` compares it, nothing else touches it), and the empirical set intersection
over `.real-generation.json` — 0/8 in all three.

---

## Which is why this morning's 4.71 was wrong

I reported **4.71 mean lines per seated player** and built a recommendation on it. The computation
was `total script lines / seat count`. That silently assumes a speaker is a seated player.

**The true figure was 0.00 for every player in all three scripts.**

The distribution *shape* I showed you was real — the skew existed, one character did take 12 of 38
— and the recommendation it produced turned out to be right. But the number was not a measurement.
It divided by a denominator it never checked the numerator against. `HANDOFF.md` §9 #25.

And the playtest packet was worse than silent about it. It told you, admiringly:

> *"Nobody told the model to name the characters. It derived a speaker name from each trait on its
> own… That is the grammar doing what it was supposed to do."*

That paragraph is a description of the bug, written as a design win, in the artefact you were meant
to read before a playtest. Rewritten. `HANDOFF.md` §9 #26.

---

## What changed

| File | Change |
|---|---|
| `server/services/scriptCustomization.service.ts` | band 30-38 → **42-52**; ceiling 2,600 → **3,000** |
| `server/services/scriptGeneration.service.ts` | both branches now **read** the length table instead of restating it as literals; calls the cast binder after validation |
| `server/services/prompts/comedyPrompts.ts` | ENSEMBLE gets a closed **CAST LIST** carrying the trait strings verbatim, RULE 1 (nobody else exists) and RULE 2 (nobody under 3 lines). HEAD_TO_HEAD the same for two. SOLO for the human only |
| `server/services/scriptCast.service.ts` | **NEW** — snaps near-miss speaker labels onto the cast, reports off-cast parts, silent players, per-seat counts |
| `scripts/playtest-packet.ts` | distribution section attributes against the cast list; the paragraph praising the bug is gone |
| 3 new test files | 48 tests. Nothing had asserted the line budget or the binding before |

**The duplicate-literal lesson from the seat cap, applied to the same file.** `generateScript` held
`{min:30,max:38}` and `2600` as literals in its default branch that *happened* to equal the
`standard` row of the table, with a comment explaining that both must be kept in step. A comment is
a worse guarantee than not having two things to keep in step. Both branches now read the table.

**SOLO is deliberately exempt from "no invented characters"** — the whole mode is one human against
2-3 characters the model creates. `logCastBinding` logs off-cast speakers at `debug` for SOLO and
`warn` everywhere else. Anyone who "fixes" that inconsistency breaks SOLO. It is commented in both
places.

### The snapper is load-bearing

Script 2 of the re-run needed **6 speaker labels snapped** onto the cast — the model varied
punctuation or casing on 6 lines. Without it, those 6 lines fail `===` and go unassigned in a run
that otherwise looks perfect. A prompt instruction is not a guarantee.

---

## The measurement you asked for

Three fresh generations, live API, 8 seats, production `generateScript` path.

| | before | after |
|---|---:|---:|
| lines per script | 37.7 | **51.3** |
| **median lines per seated player** | 0 | **6** |
| **range** | 0-0 | **4-12** |
| **distinct parts vs 8 seats** | 9 / 8 / 9 | **8 / 8 / 8** |
| mean per seated player | 0.00 | 6.42 |
| lines belonging to nobody | 113 of 113 | **0** |
| reading time at 120 wpm | 1.8 min | 2.7 min |
| words per line | 5.80 | 6.29 |
| **cost per round** | **$0.0400** | **$0.0550** |

**Acceptance: median ≥ 5 and no speaker below 3. Result: median 6, floor 4.** ✅

Per-seat distributions: `12/5/5/6/6/6/4/6`, `10/5/8/5/5/7/6/6`, `9/5/6/7/8/6/5/6`.

---

## Quality — you asked to be told plainly

**The scenes did not get stiff and they did not get evenly boring.**

Line length held: 6.29 words/line, longest line 14 words, no essay-mode drift. The lead survived —
busiest seats took 12, 10 and 9 against a floor of 4. The prompt states the floor is a floor and
states explicitly that it is **not** an instruction to divide lines evenly, because that is the
failure mode you named in advance and it is exactly how a model in a hurry reads "everyone gets at
least 3".

If anything the traits drive the voices harder now, because the character label *is* the trait.
From script 3, *Interprets all silence as agreement* gets:

```
[Interprets all silence as agreement] ...
[Interprets all silence as agreement] Unanimous. We're staying.
```

That joke only exists because the part is bound to the card.

**The one real cost is cosmetic.** Speaker labels on the teleprompter are now sentences, not names.
`MobileTeleprompter.tsx:226` renders them at 13px uppercase mono, centred — a 50-character trait
wraps to two or three lines above every line of dialogue. Legible; uglier. **Not changed. It is a
design call and it is yours.** There is a shorter display form available that keeps the binding
(display an abbreviation, match on the full string) if you want it.

---

## The cost forecast was wrong, and it was mine

| | |
|---|---:|
| I told you this morning | ~$0.0437 (+15%) |
| Measured | **$0.0550 (+37.5%)** |

Neither cause is the line budget:

1. **Input 4,377 → 4,908 tokens** — the cast-list block is ~500 tokens of prompt.
2. **Output 39.2 → 46.3 tokens per line** — a ~50-character speaker label instead of a
   6-character first name, on every single line.

Both are the cast-binding change. **I forecast the change I was recommending and not the change I
was about to make.** $9 of credit now buys **~164 rounds** rather than ~225. `HANDOFF.md` §9 #27.

---

## Applying the invite-card lesson

You said: *"curl every route this touches on the live site. Compiling is not responding."*

**14 routes curled against `https://plotslop.com` after the restart. No 500s.**

| Route | |
|---|---|
| `/`, `/host`, `/join`, `/clips`, `/digest` | 200 |
| `/replay/TEST`, `/join/invite/TEST` | 200 |
| `/opengraph-image` | 200 image/png, 135 KB |
| `/replay/TEST/opengraph-image` | 200 image/png, 117 KB |
| `/join/invite/TEST/opengraph-image` | 200 image/png, 118 KB |
| `/api/clip-card/TEST` | 200 image/png |
| `/api/poster-story/TEST`, `/api/character-card/TEST/P1` | clean 404 |
| `/api/room-preview/TEST` | 404 JSON |

My first three share-card URLs 404'd because I used query params on routes that take path params —
my error, not a defect. Retried correctly.

### And I went further, and hit a wall I am reporting rather than papering over

Everything above is HTTP. **The change lives in the socket path**, so I wrote a smoke test that
drove nine sockets into a live room on the deployed server to force a real generation. It got as
far as the credit gate:

```
[WARN] Operation blocked: no hostUid for room Y42X
       → "Authentication required to generate scripts."
```

`server/socket/helpers.ts:99`, working as designed — credits are tied to a Clerk user, so **a host
who is not signed in cannot generate a script in production.** Not a defect, not changed, and worth
knowing before the playtest: **you must be signed in to host.**

So, precisely: the deployed process **loaded** the new code — the import chain
`server.ts → handlers → game.handler → scriptGeneration.service → scriptCast.service` is fully
static, and the process booted clean and served a live room with 8 seats and dealt cards. The
generation path itself ran end-to-end against the **real API four times** on this box through the
production `generateScript`, and through the full socket path with the mock in the harness.

**What is not verified is that specific combination: the deployed process making a real call.** One
signed-in round of yours closes it. I am not calling it done.

The test room `Y42X` cleaned itself up; zero connections on :3100 now.

---

## Verification

| Gate | |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx jest` | **517/517** (was 469) |
| `npx tsx scripts/harness/run.ts` | **50/50** — and its cost check independently confirms `max_tokens = 3000` reaching the model |
| `npm run build` | exit 0 |
| Live routes | 14 curled, no 500s |
| Real API | 4 generations (3 ENSEMBLE + 1 SOLO ceiling check), none truncated |
| Journal since restart | **0 errors** |

**Non-vacuity, per rule 2.2.** The prompt drift guard was proved to fire: injecting the pre-fix
state (cast list built from the `asPerformer`-wrapped strings rather than the raw traits) turned
exactly the five verbatim assertions red and nothing else. Restored and re-greened.

Deployed **19:18:42 UTC**. `deploy.sh` took its EOF abort at the restart prompt again; I checked
the window (zero connections, no persisted rooms) and completed it manually. Did not pipe `y`.

Commit `7993c88c` on `audit/2026-07-28-snapshot`.

---

## What is yours now

Seven items in `NEEDS-JACKSON.md`, none of them urgent, and nothing is blocked on the top one:

1. **The teleprompter label** — do you want a shorter display form, or live with the sentences?
2. Cutover step 6 — cgroup re-verification on the running unit. Still blocking.
3. Delete the Vercel project — no token on this box.
4. `plottwists.com` — informational.
5. Clerk production instance — the live site still runs on the dev instance.
6. Android signing-key fingerprint.
7. CGNAT — eventually.

And one standing fact: the corrections list is at **27**, seven sessions running. The three added
tonight share a shape worth keeping. Yesterday's were claims checked from the wrong side of a
boundary. Tonight's are three places where the instrument, the artefact and the forecast all
**agreed with each other and were wrong together**, because they shared a premise none of them
tested — that a `speaker` string means a person.

**Agreement between your own instruments is not corroboration when they share an assumption.**
