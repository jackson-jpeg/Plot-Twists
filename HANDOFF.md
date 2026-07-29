# HANDOFF — PlotSlop

**Written 2026-07-29 for a session that has never seen the preceding conversation.**
Read this before `AUDIT.md` (1100+ lines) or `CHUNKS.md`. Machine labels: `[VPS]` = this Linux
box, `[MACBOOK]` = Jackson's Mac over the tunnel.

---

## 1. Where things are

| | |
|---|---|
| **Canonical repo** | `/root/Plot-Twists` — Next.js 16 + Socket.IO game server. **This is the product.** The game ships on the web at `plotslop.com`, marketing and game on one domain, players join in a phone browser with a room code and never install anything (`DECISIONS.md` #12). |
| **Branch** | `audit/2026-07-28-snapshot` (tracks `origin/`). **Not** `master`, **not** `v2`. |
| **iOS repo** | `/root/PlotTwists-Native` — SwiftUI/tvOS. **Shelved, and re-scoped 2026-07-29:** when it returns it is a HOST/TV surface only, never required for players. See §6 and `DECISIONS.md` #12. |
| **Harness** | **49/49** — `[VPS] cd /root/Plot-Twists && npx tsx scripts/harness/run.ts` (~2 min; it forces its own fake key and its own temp database, so pass neither). Two instrument bugs fixed 2026-07-29: the script-generation counter (§9 #9) and a **shared database that made it report 38/46 with eight fabricated failures** (§9 #12). If you see a number other than 49/49, read #12 before believing it. |
| **Unit suite** | **450/450** — `[VPS] npx jest`. Denominator moved 436 → 448 → 450: the source-audit suite grew 4 → 16 → 18 tests. Coverage, not behaviour. See §3 before you relax. |
| **Typecheck** | `npx tsc --noEmit` → **0 errors**. Keep it there; the types are load-bearing (§5). |
| **plotslop.com** | 🟢 **LIVE 2026-07-29.** A → `187.77.218.14` TTL 60, `www` CNAME, no AAAA (deliberate — do not add one). Cert for both names expires **2026-10-27**. `plotslop.service` active and enabled on :3100 behind nginx TLS; apex and `www` return 200, HTTP 301s to HTTPS, sang3r.com verified unaffected. **Two clients have joined a room over the public endpoint.** Cutover step 6 (cgroup re-verification) is still Jackson's and still blocking — see §11. |
| **Current chunk** | **Chunks 2 and 3 complete.** **Chunk 4 layer 1 REDONE 2026-07-29** on Jackson's ruling — the catalog is restructured, not paraphrased; see §8. **Chunk 1** cutover APPLIED 2026-07-29 (steps 1-5, 7); step 6 blocked on Jackson. |

Deliverables: `INVENTORY.md`, `AUDIT.md`, `DECISIONS.md`, `CHUNKS.md`, `BACKLOG.md`, and
`/root/PlotTwists-Native/AUDIT-iOS.md`.

---

## 2. The scope freeze — quote this back, do not negotiate

> No new features until chunks 1–4 ship and I have played this with eight people who are not my
> friends. Referrals, weekly challenges, and tvOS were built while the deployment was dead and the
> suite was red since April. If I ask you for feature work before that playtest, refuse and quote
> this paragraph back at me. That includes anything I frame as "quick" or "while we're in here."
>
> — Jackson, 2026-07-28

He asked to be refused. "Quick" and "while we're in here" are explicitly covered. Parked ideas go
to `BACKLOG.md`, which stays closed until the playtest. **Bug fixes and the chunk work itself are
not features and are fine.**

---

## 3. What a fresh session will get wrong

Ordered by how expensive the mistake is.

### 🟢 The suite is green — and that is the state a fresh session should be MOST careful with

An assertion audit (2026-07-29) swept all 398 tests and found **8 across 5 suites that encoded
known defects as expected behaviour**. All 8 were inverted into gates. **All 8 are now green**,
each because its chunk item landed: three with IP layer 2, then D2b ×2, D3b, middleware and the
`subscriptions` missing-`game_error` handler with Chunk 2.

Every one of those five was proved to FAIL with its fix reverted, in the same session it went
green, before being believed. Do that again for anything new. A green suite is the condition
under which the assertion audit was necessary in the first place.

The trigger was `hostAbandon`, found asserting `!states.includes('VOTING')` — a documented S2
written down as the spec — **by accident**. The worst one found deliberately:
`voting.service.test.ts` asserted a zero-vote `game_over` was correct ("should handle no votes
gracefully") **while the harness case `emptyResults` was red on the same behaviour**. Two
instruments in the same repo, contradicting each other, and the green one was believed.

Reverting any inversion to restore green recreates exactly the problem that was just removed.
Full table in `AUDIT.md` → *Assertion audit*.

### 🔴 STANDING RULE — two mechanisms, or it is not a finding

**No defect is reported without independent confirmation by a mechanism different from the one
that found it.** Not a second run of the same instrument — a *different* instrument. A harness red
gets confirmed by a unit test, by reading the code path, or by driving the server by hand. A unit
failure gets confirmed by the harness or by the real path.

**The rule holds with the sign reversed: a green arriving at a convenient moment is a hypothesis
too.** Mid-change on 2026-07-29 `spectatorVote` flipped green because the vote was silently never
registering. A false green is a false finding wearing better clothes, and nothing in the suite
will tell you.

Where this came from, in one day's work: three plausible reds were instrument bugs (listed below),
one green was a broken code path, and one freshly-written test asserted the right thing at the
wrong layer — `validation.test.ts` claimed shape validation rejects the literal `"Shrek"`, which
it does not and should not; see the comment block in that file. Five for five, the first result
was wrong about something. "I ran it and it was red" is not evidence, it is a prompt to check.

Cost of the rule is minutes. Cost of skipping it is either a defect report that sends the next
session chasing an instrument bug, or a real defect closed because the test that "proved" it fixed
was vacuous.

### 🔴 A red harness case is a hypothesis, not a finding. Verify before reporting.

While adding the six new scenarios, **three separate plausible reds turned out to be instrument
bugs, not defects**:

1. "2 script generations for one round" — `mockStats.requests` counts *every* Anthropic call and a
   round fires several; the second was plot-twist pre-generation.
2. "The sequel is a replay of the same script" — the mock returns a fixed title.
3. The replacement for (2) was *also* wrong — it searched the user message, but the sequel prompt
   is appended to the **system** prompt.

All three would have shipped as "newly discovered defects". There is a fourth of the same shape
already recorded: `audience.service.ts:562` logs `parsed.map is not a function` in every scenario
— that specific error is a mock artifact, though the unguarded cast behind it is a real S3.

### 🟠 The harness ratio moved for two different reasons. Say which.

16/28 → 35/45 was **mostly wider coverage**: of those 19 new passes only 3 were behaviour changes
(two `identityBroadcast` cases + the leak guard); the other 16 were paths never previously driven
that turned out to already work.

35/45 → **38/46** is different, and is real: `abuse → server REJECTS off-catalog card text` and
`→ injected text does NOT reach the model prompt` both flipped red→green when IP layer 2 landed,
and the +1 denominator is a genuinely new check (a well-formed ID that is not in the catalog).

Always say which kind of movement a number represents. "The harness went up" is not information.

### 🟠 28 was never a completeness claim, and 45 isn't either.

Explicitly still uncovered: multi-instance behaviour (see CONSTRAINT-1), reconnect during LOADING
specifically, Firestore rules.

### 🔴 The IP fix is three layers, and LAYER 1 TOOK TWO ATTEMPTS.

Jackson's original correction still stands and is the most important non-obvious fact here:

1. Catalog grammar — the character slot is a TRAIT, not a person (`DECISIONS.md` #4)
2. **Server-side validation that submitted card IDs resolve against the catalog**, with free
   text never interpolated into a system prompt
3. Output screening for named real people and owned franchises

**Layers 2 and 3 landed first pass and hold. Layer 1 took two**: the first attempt produced
paraphrase and was only caught when a playtest packet made somebody read the catalog. It was
redone on 2026-07-29 against a structural definition. See §8. Do not repeat the earlier claim in
this file that all three landed first time — that claim was mine and it was wrong.

Still true, and now demonstrated rather than hypothesised:

- The layer 3 screen is a **deterministic term list**. It catches named entities and nothing
  else. "A wheezing tyrant in black armour who is secretly your father" passes it clean. That
  was written here as a hypothetical. `PLAYTEST-2026-07-29.md` shows it is the actual state of
  most of the catalog.
- Layer 2 removed the **"✎ Write your own" free-text card**. A user-visible feature removal
  that partly contradicts AUDIT.md Option B.
- **Runtime checks cannot see source files, and this is the single most expensive lesson in
  this document.** The layer-3 screen inspects generated scripts; the catalog tests inspect
  exported names. Neither can see a comment or a prompt template. That is how four section
  comments survived layer 1 with every check passing — and then how four MORE leaks in three
  OTHER files survived the gate written to catch the first four, because that gate audited one
  file. One of them, `"Yoda talks like Yoda"`, was in the live user prompt on every request ever
  sent. Now gated by `__tests__/unit/lib/contentSource.test.ts` across **five** files. §8 has the
  table. **Add new prompt or catalog files to `AUDITED_FILES` or they are unwatched.**

### 🟠 Settled. Do not re-raise.

- **PLOTSLOP was trademark-checked and recorded clean.** The rename Plot Twists → PlotSlop is
  decided. `plotslop.com` is owned.
- **`plot-twists.com` was *deliberately* allowed to lapse** (deadline was 2026-08-01), verified
  safe because nothing shipped. It is not an oversight. But see §6 — it becomes dangerous the
  moment an iOS build ships.
- **Do not build the mascot ("Reely").** Zero implementation in either codebase; resolved by
  deletion. In `BACKLOG.md`.

---

## 4. Open — needs Jackson, not you

> **The authoritative, ordered list is `NEEDS-JACKSON.md`.** This section is kept as context
> for the four that have been open longest; anything new lives there.

1. **Firestore (`DECISIONS.md` #7).** Two findings from 2026-07-29: there is **no Firebase project
   ID anywhere in either repo**, and `/root/PlotTwists-Native/firebase-debug.log` shows the CLI
   calling `projects//services/...` — an **empty** project segment. That session was never linked
   to a project. There is no `firebase`/`gcloud` on this box and `firebase-tools` cannot retrieve
   rules. **Console access required.** First question: does a project exist at all? If yes, get the
   rules and a rough document count per collection **before** anything is deleted — if non-Jackson
   user records sat under permissive rules, that is a disclosure question.
2. **Three secrets, still not supplied.** `ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`,
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Placeholders sit in `/etc/plotslop/env`. The publishable
   key is needed at **build** time (it was the Chunk 1 root cause) and is not a secret.
3. **DNS.** `plotslop.com` still resolves to `2.57.91.91` (Hostinger parked). Target
   **`187.77.218.14`**. Note this box also has IPv6 `2a02:4780:4:1c0b::1` — an AAAA record makes
   HTTP-01 validate over v6, which must reach the same nginx.
4. **`DECISIONS.md` #10** — copy voice. Blocks Chunk 5 only.

**Q1 (how far to rewrite the catalog) was answered on 2026-07-29 and is closed** — Option A,
restructured rather than sanded. See §8. Two new items opened in its place: whether the install
prompt should still fire on the player join path, and two public-domain settings I flagged as
arguable. Both in `NEEDS-JACKSON.md`.

---

## 5. Things that will bite you if you don't know them

**The types are the enforcement.** `ServerToClientEvents` is typed in terms of `PublicPlayer` /
`PublicGameResults`, so `tsc` rejects any emit site passing a raw server-side `Player`. Every
player object leaving the server goes through `toPublicPlayer` in `server/socket/serialize.ts`,
which is an explicit **allow-list** — a new field on `Player` is invisible by default. Do not widen
these back to `Player` to make an error go away; that re-opens D2b.

**`Player.id` vs `Player.publicId`.** `id` is the internal key (of `room.players`, `room.votes`,
`room.selections`, and `playerId` in results/gameHistory/playerStats) and is **never emitted**.
`publicId` is random per-room, carries no authority, and is the only player identifier clients see.
`submit_vote` takes a `publicId`. A publicId names a **seat**, never the caller — the voter is
still resolved from the socket.

**The leak guard scans ACKs, not just events.** Three of the D2b leaks were in ack payloads
(`join_room`, `request_resync`, the recovery snapshot), which `onAny` cannot see. It has been
verified by observed failure: re-adding `sessionId` at one point in `toPublicPlayer` produced 39
leak paths.

**`server/db/json.ts:11` is `path.join(process.cwd(), 'data')` — cwd-relative, not absolute.** The
live database sits inside PlotSlop's tree *only* because the systemd unit sets
`WorkingDirectory=/srv/plotslop`. Change that and the data silently relocates.

**CONSTRAINT-1: single replica is architectural.** Three mechanisms each break at N>1 (no Socket.IO
adapter, the process-local `txnLock` its own comment labels dev-only, five in-memory timer maps).
The consequence that matters: **every `systemctl restart` ends every live game mid-round**, because
host-disconnect recovery is still broken (D3, red). Full section in `AUDIT.md`, including a
falsifiable trigger for when the adapter must be replaced.

**Memory ceiling is measured, not guessed — and the instrument has now been wrong four times.**
`MemoryMax=768M` **stands.** Re-measured 2026-07-29 after fixing a fourth sampler bug, five runs:

| Load | Baseline | Peak | Growth |
|---|---|---|---|
| 6 rooms × 10 (66 sockets) | 270.7 / 271.3 MB | **336.0 / 334.8 MB** | 65.3 / 63.5 MB |
| 20 rooms × 10 (220 sockets) | 262.4 / 268.3 / 270.8 MB | **323.0 / 325.1 / 332.0 MB** | 60.6 / 56.8 / 61.2 MB |

Worst observed peak **336 MB = 44% of the ceiling.** Jackson's "within 30%" trigger needs ~538 MB.

**Three things the number hides.** ~80% is idle Node runtime, not the game. The mock Anthropic
returns *instantly*, so this is a FLOOR — real in-flight generation is higher by an unmeasured
amount; do not quote 336 as production. And **six rooms now cost the same as twenty**, which
retires the earlier "sub-linear growth" reading in this file: that comparison was computed from
a sampler that was undercounting the 20-room runs.

**Four instrument bugs in this one script, all with the same signature.** (1) Sampled the `npx`
wrapper, not the server. (2) Swallowed stderr, so a driver-caused failure read as a product
failure. (3) `server.kill()` left a stale listener, so a run measured the *previous* run's
server. (4) `refreshPids` seeded its BFS frontier only from newly-discovered pids, so it never
descended past depth one after the first pass and intermittently missed the actual server
process — alternating runs of an identical command reported 4 pids/268 MB and 3 pids/149 MB.

**Suspect any run where peak equals baseline.** That has now been the tell every single time.
Run it at least twice; two runs disagreeing by 120 MB is what exposed (4), and one run alone
would have looked plausible either way. `[VPS] npx tsx scripts/harness/load.ts 20 10 2`

**Deploy is two trees.** Source `/root/Plot-Twists` (root-owned, editable, autosync'd to the Mac),
runtime `/srv/plotslop` (owned by the `plotslop` system user), via `scripts/deploy.sh`. They are
separate so the unit can set `ProtectHome=true`, which makes `/root` — Sanger and its secrets —
invisible to the process. Measured: **without** it, the plotslop user could read Sanger's source
and enumerate `/root/Sanger/.env.local`. The unit is installed but **not enabled and not started**;
it cannot run until the secrets land.

### 🚧 BLOCKING — isolation is NOT proven until it is re-verified on the live unit

Every isolation measurement so far was taken on a **transient** `systemd-run` unit carrying the
same directives. That proves the directives work. It does **not** prove the installed
`plotslop.service` gets them, and a typo, an override drop-in, or a delegated cgroup would not
show up any other way. **The Sanger isolation is not proven until this passes.**

Run all four against the running long-lived service, reading **effective** values out of the
actual cgroup, not out of the unit file:

- [ ] `systemctl show plotslop -p MemoryMax,MemoryHigh,MemorySwapMax,CPUQuotaPerSecUSec,TasksMax,User`
      — and cross-read `/sys/fs/cgroup/system.slice/plotslop.service/memory.max`, `memory.high`,
      `memory.swap.max`, `cpu.max`. The file is the claim; the cgroup is the fact.
- [ ] **OOM kill fires**, and the process *dies* rather than stalling — `journalctl -u plotslop`
      shows `result 'oom-kill'` and `Restart=always` brings it back. A reclaim-throttled stall is
      worse than a crash: `Restart=` never fires. That is why `MemoryHigh` is 700M and not 640M.
- [ ] **CPU quota bites** under a *multi-threaded* load. A single-threaded spinner proves nothing —
      it uses one core whatever the quota says. Compare total CPU-seconds over a fixed wall window.
- [ ] **`ProtectHome` denies `/root`** from inside the *service's* namespace:
      `systemctl show plotslop -p MainPID` then `nsenter -t <pid> -m -- ls /root` → must fail.
- [ ] **Data dir is inside the tree and nowhere else** — `ls /proc/<pid>/cwd` resolves to
      `/srv/plotslop`, `lsof -p <pid> | grep '\.json'` shows no handle outside it, and a write
      outside `ReadWritePaths` returns `EROFS`.

Record the numbers, not "verified". See `AUDIT.md` → *VPS co-tenancy*.

**`npm test` runs coverage with a ratchet** (stmts 17 / branches 10 / funcs 14 / lines 17), set
just below actual. It is a regression guard, not a target.

---

## 6. iOS — shelved, re-scoped, with a blocking gate

**Re-scoped 2026-07-29 (`DECISIONS.md` #12): when iOS returns it is a HOST/TV surface only and is
never required for a player.** The game ships on the web; players join in a phone browser with a
room code and never install anything. `/root/PlotTwists-Native` is currently a complete *player*
app — lobby, selection, loading, performing, voting, results — so what comes off the shelf is a
different shape from what went on it. That is a re-scope, not a rename. Nothing to do now.

No rename of its 349 occurrences, no bundle-ID decision, tvOS target kept. Bundle IDs
(`com.plottwists.*`) were never submitted, so changing them later is free. The only permitted
change while shelved is deleting six bundled crossover poster assets (Chunk 4a).

**🚫 No iOS or tvOS build ships until the checklist at `CHUNKS.md` §"Chunk 8" is fully ticked.**
`PlotTwists/iOS/PlotTwists.entitlements` still points `applinks:` and — worse —
`webcredentials:clerk.plot-twists.com` at a domain that was deliberately allowed to expire. Once it
lapses, whoever registers it inherits association with this app's **credential autofill**. Letting
the domain go was safe *because nothing shipped*. It stops being safe the moment a build does.

---

## 7. What was done on 2026-07-29

Twelve commits on `audit/2026-07-28-snapshot`, plus one in the iOS repo.

| Commit | What |
|---|---|
| `10d990d2` | Assertion audit — 267 negative-assertion sites classified; 8 defect-encoding tests inverted |
| `57c5dc80` | CONSTRAINT-1 recorded with trigger + deploy practice |
| `1ceaff0d` | VPS isolation from Sanger — user, cgroup limits, `ProtectHome`, all verified by demonstration |
| `ed65c23f` | D2b serialisation boundary + generic leak guard (harness 16/28 → 19/29) |
| `9258b985` | Six unexercised paths driven (harness → 35/45) |
| `57414000` | This file |
| `8c1ca476` | **Chunk 4a** — delete the crossover poster briefs *and every rendered copy* (the 6 showcase PNGs were live on the homepage) |
| `e24f8dee` | *(iOS repo)* Chunk 4a — the six bundled crossover poster assets |
| `5b383321` | **Chunk 4 layers 2+3** — card IDs on the way in, output screening on the way out (harness 35/45 → 38/46; all 3 new passes are behaviour, not coverage) |
| `b0277826` | **Chunk 4 layer 1** — 375 catalog entries rewritten to archetypes, every `source` deleted, all IDs regenerated |
| `7e397f41` | Real peak RSS measured — the 768M ceiling had been sized against an attack test, never against a party |
| `689b2f35` | Live-unit cgroup re-verification made a blocking Chunk 1 checklist |
| `823eb40c` | Chunk 4 marked code-complete, with what is **not** closed |

**Layer 2 had never landed**, contrary to the record. `validateCardSelection` still took free text,
stripped `<>'"` and accepted it — layer 1 was about to be written on top of it. Found by the
re-verification Jackson asked for; confirmed independently by three `validation.test.ts` gates already
sitting red pending "Chunk 2 item 1".

**Memory:** peak **334.7 MB** at 20 rooms × 10 players (220 sockets), baseline 270.3 MB. 44% of the
768M ceiling, so it stands. Caveat: ~80% of that is idle Node runtime, and the mock returns instantly,
so real peak with in-flight generation is higher by an unmeasured amount.

**Later the same day — six more commits, and Chunk 4 reopened:**

| Commit | What |
|---|---|
| `f7ea659e` | This file, brought up to date after it went stale at the six-commit mark |
| `80f50737` | **Chunk 2 items 2–7** — harness 38/46 → 47/48, suite → 432/432, all five gates green |
| `ea9504ea` | **Chunk 3** — rate limiters re-keyed, live-room cap, dead config, Fisher-Yates, npm audit (7 criticals → 0) |
| `d3f31d97` | Cutover STAGED and unexecuted — nginx, unit, certbot, `cutover.sh` |
| `a5655949` | Playtest packet — **and the finding that reopens Chunk 4** |

---

### Afternoon pass — 2026-07-29, on Jackson's Q1 ruling

| What | Where |
|---|---|
| Catalog restructured: 251 traits / 126 settings / 133 situations, seeded shuffle | `scripts/build-catalog.ts` → generates `lib/content.ts` |
| Trait cards wrapped as `someone who …` at the prompt boundary | `comedyPrompts.ts` — one wrapper, all 13 interpolation sites |
| **`"Yoda talks like Yoda"` removed from the live user prompt**; `Yoda` added to the denylist | `scriptGeneration.service.ts:82`, `protectedTerms.ts` |
| `"The Office" / "Community"` removed from ensemble mode instructions | `comedyPrompts.ts:367` |
| `Michael Scott` / `The Office` removed from type-doc comments; `source` field deleted | `lib/content-types.ts` |
| Franchise-attribution UI badge deleted (it rendered `item.source` to players) | `CardBrowseModal.tsx`, `CardPicker.tsx` |
| Source-audit gate widened 1 file → **5**, plus grammar and ordering gates | `contentSource.test.ts` — 4 tests → 16 |
| Playtest packet regenerated at **40 hands** against the new grammar | `PLAYTEST-2026-07-29.md` |
| Layer 1 redefined structurally; web-first product decision recorded | `DECISIONS.md` #4, #12 |

**Verification.** Unit suite **448/448** (was 436/436; +12 is the source-audit suite growing,
coverage not behaviour). Harness **49/49**, denominator unchanged — correct, nothing here touched
realtime behaviour. Typecheck 0 errors.

**Gate proved fail-before-fix.** Against the pre-fix tree the new gate ran **9 failed / 5 passed**,
every failure a real defect. Re-inserting `"Yoda talks like Yoda"` alone after the fix produced
`1 failed` with the term named. Two of my own gate assertions were wrong on the first run and are
recorded in §9 rather than quietly corrected.

---

## 8. ✅ CHUNK 4 LAYER 1 — REDONE 2026-07-29. Read this before touching the catalog.

**It was reopened this morning and closed this afternoon on Jackson's ruling.** He chose Option A
but restructured rather than sanded: *"Do not sand down the existing entries — change the card
grammar."* The binding definition now lives in `DECISIONS.md` #4 under "Layer 1, redefined".

**What was wrong.** Commit `b0277826` was described as "375 catalog entries rewritten to
archetypes". They were rewritten to **paraphrase** — every entry still an individually
identifiable description of the same protected character, with franchise-by-franchise cast
ordering intact. Found by generating a playtest packet and reading real dealt hands. Nothing
automated could have caught it: layer 3 is a fixed denylist of NAMES and returned clean on all
of it, permanently.

**What the catalog is now.** `lib/content.ts` is **generated** — do not hand-edit it. The
authored source is `scripts/build-catalog.ts`; regenerate with `[VPS] npx tsx
scripts/build-catalog.ts`. 251 traits, 126 settings, 133 situations.

- The **character slot is a trait or flaw**, never a person: *"Insists nothing is wrong at
  increasing volume"*. No job title, no species, no era.
- **Specificity moved to settings and situations**, which are not IP-constrained and were
  carrying almost none of the comedy.
- **Order is a seeded shuffle.** This is load-bearing, not cosmetic — the grouping alone used to
  identify entries that were individually deniable.
- **Public domain is used deliberately, in settings only.** Rules 2 and 5 of the definition
  conflict for a Holmes or Dracula card; the resolution is written up in `DECISIONS.md` #4 and is
  an interpretation, not something Jackson specified.

**🔴 THE THING A FRESH SESSION MOST NEEDS TO KNOW: `lib/content.ts` WAS NEVER THE WHOLE SURFACE.**

The first gate audited one file, because everyone assumed the catalog was one file. Four more
leaks were found on 2026-07-29 in three other files, and one of them had been shipping to the
model on every single request ever made:

| Where | What | Caught by the runtime screen? |
|---|---|---|
| `scriptGeneration.service.ts:82` | Live user prompt read *"Write in the distinct voice of each character (Yoda talks like Yoda…)"* | **No** — and `Yoda` was not even in `protectedTerms.ts`, so the screen could not have caught it coming back either. Both fixed. |
| `comedyPrompts.ts:367` | Ensemble mode instructions read *`Structure it like "The Office" or "Community."`* — sent every ensemble round | **No.** The term list holds character names, not franchise titles. |
| `lib/content-types.ts:3,7` | Field docs read `// "Michael Scott"` and `// "The Office"` | Yes, 2 hits — but nothing was ever pointing it at this file. |
| `lib/content.ts:647` | Live catalog **entry name**: *"Trapped in a Saw-like scenario"* | **No.** "Saw" is ordinary English and is not on the denylist. |

`__tests__/unit/lib/contentSource.test.ts` now reads **five files as TEXT**. If you add a file
that carries catalog or prompt text, add it to `AUDITED_FILES` — that list is the whole defence,
because every other IP check in this repo inspects runtime values and structurally cannot see a
comment or a prompt template.

**What the gates cannot do.** They check grammar, ordering, franchise titles and named entities.
They **cannot** check "does this map 1:1 to a character" — nothing can. That is the human
done-criterion in `DECISIONS.md` #4: sample 30, try to name them. Run 2026-07-29, 30/30 could not
be named.

---

## 9. Corrections to the record found on 2026-07-29

**Twelve now, across four passes**, and they are listed because the pattern matters more than any
one of them: **the written record has been wrong about a completed item four sessions running.**
Go looking. The afternoon pass found three more (5–7) *inside the fix for number 1*, and the
evening pass found two more (8–9) *inside the fix for those* — which is the strongest available
argument for not trusting a completion claim, including one made hours ago.

1. **Chunk 4 layer 1** — above. Called complete; was paraphrase. Redone 2026-07-29.
2. **The "2-minute PERFORMING sweep"** at `room.service.ts:463`, which CHUNKS.md item 3 and the
   harness both describe as ending an abandoned round with zero votes, is inside
   `loadRoomsFromFirestore` and **only runs at server startup**. During a live session nothing
   moved the room at all — the real behaviour was worse than recorded.
3. **Chunk 3 item 4 (Fisher-Yates)** was already closed by IP layer 2, which replaced the code
   path it points at. The biased idiom survived in three OTHER files the chunk did not list.
4. **`aiFailure` × 2 in the harness** were instrument artefacts, not defects: they asserted on
   two event names the server never emits, and their own failure text contradicted the state
   path printed beside it. Verified green with zero product changes.

5. **The source-audit gate itself was scoped to one file** and called sufficient the same day.
   Widening it to the other files carrying catalog and prompt text immediately turned up three
   more leaks, including `"Yoda talks like Yoda"` in the live user prompt — a protected name
   handed to the model on every request, with `Yoda` absent from `protectedTerms.ts` so the
   screen could not have caught it returning. §8 has the table.
6. **My own first ordering gate was wrong in the dangerous direction.** It demanded no run of
   more than three same-category entries, which a genuinely random shuffle cannot satisfy — the
   trait deck is ~48% one category, so chance alone produces runs of eight. It failed the
   CORRECT file, and the obvious way to "fix" it would have been to un-randomise the order.
   Replaced with an adjacency rate measured against the random expectation for the same category
   distribution (old file 5.0× over chance, new file 0.98×).
7. **My own franchise-title matcher produced two false positives on its first run**, flagging
   `A Community Centre Mid-Refurbishment` and this repo's own phrase "to keep off the wire". Both
   ordinary English. Ordinary-English titles now match only in attributive position (quoted, or
   `X-like`), and the resulting blind spot is written into the test file rather than left
   implicit — a gate that cries wolf gets ignored, which is worse than no gate.

One correction on the record: when the `publicId` approach was chosen, it was justified partly by
"`player.id` is `playerSessionId ?? userId ?? legacy_uuid`". **That was wrong** — that expression
is `sessionId`; `id` has always been `uuidv4()`. The Clerk `sub` leaked via `uid`, not via `id`.
The split still stands as defence in depth, but it was not removing a Clerk-sub leak.

---

**8. A FIFTH franchise leak, in the live SOLO prompt, past a gate built to catch exactly this.**
`getModeInstructions` shipped this to the model on every SOLO round:

```
- If the setting is from a known show/universe, USE THOSE CHARACTERS
```

Every layer passed. The source audit looks for franchise NAMES and there is no name in that
sentence. Layer 3 screens output, and the output it produces — a correctly-named character from
a show the setting evokes — is exactly what the instruction requested. It also contradicted its
own block, which four bullets earlier says to invent originals and never name an existing
character. **The generalisation: a leak does not need a proper noun, it needs PERMISSION.** Fixed,
and `contentSource.test.ts` grew a second describe block that reads prompt text for
permission-shaped instructions. Verified by reintroducing both this line and the old `Yoda talks
like Yoda` and watching the new gate go red on each.

**9. The harness's own script counter was calibrated to a number, not to a boundary.**
`scriptGenerations()` identified script calls by `max_tokens >= 5000`, chosen because ENSEMBLE
asked for 10,000. When the script ceiling dropped to 2,600, three checks reported **"0 generation
requests reached the model"** — a working product failed by its instrument, the direction a gate
must never fail in. The same bug was already latent: `lightning` asks for 2,048, so any run
against a lightning-length game had been counting zero scripts all along. The floor now sits
between the two populations (1,000; non-script calls are 400/500, the smallest script call is
2,048) and `assertFloorSeparates()` throws at startup if a future value crosses it.

**10. `deploy.sh` had never been run, and it did not work.** Two bugs, both fatal, both invisible
until a real machine executed them. The unit file, the nginx configs and the isolation directives
were all validated offline; the deploy script was the one part that had to survive contact with
reality, and it was the one part nobody had exercised.

- **`npm ci` was silently skipping typescript.** `deploy.sh` sources `/etc/plotslop/env` under
  `set -a`, exporting `NODE_ENV=production` — right for the runtime, wrong for the build. npm reads
  it and sets `omit=dev`, so typescript (a devDependency) was never installed. `next build` then
  auto-installed `typescript@latest` (6.0.3) and **rewrote `package.json`, clobbering a deliberate
  exact pin at 5.9.3**; `ts-jest`'s peer range is `>=4.3 <6`, so the following `npm prune` died on
  ERESOLVE — after the build had succeeded, so the log read clean right up to the failure. Fixed
  with `npm ci --include=dev`, plus a guard that aborts the deploy if the build edited
  `package.json`/`package-lock.json`. Verified directly: `NODE_ENV=production npm config get omit`
  prints `dev`; unset, it prints empty.
- **The rsync filter deleted a source file the app needs.** `--exclude 'data'` has no leading
  slash, and an unanchored rsync pattern matches at *every* depth — so the exclusion protecting the
  top-level JSON database also excluded `server/data/`, holding `communityPacks.ts`, which
  `cardpack.service.ts` imports at startup. Fixed to `/data`. Found by diffing the trees rather
  than chasing one `MODULE_NOT_FOUND` at a time: exactly one file was missing.

**11. A fixed deploy that reads exactly like a broken one.** After the rsync fix the service still
would not start, and `journalctl` showed the *same* `MODULE_NOT_FOUND` stack trace. The fix had
worked. `StartLimitBurst=5` had been spent by the previous crashloop, and systemd **latches** it:
the restart never spawned a process, so the newest line in the journal was still the previous,
already-fixed crash.

The lesson is about evidence, not systemd. The natural response to that journal is to go re-fix
something that was never broken, and it cost about an hour. `deploy.sh` now runs
`systemctl reset-failed` before `restart`. **Note for step 6:** a deliberate OOM test spends the
same budget — finish with `reset-failed`, or the next start refuses and hands you a stale error.

**12. The harness shared a database with every previous run, and lied convincingly about it.**
The worst instrument bug of the three, because its output was *more plausible than the truth*.

`server/db/json.ts` resolved `<cwd>/data`, so the harness wrote to `/root/Plot-Twists/data` —
shared with every earlier run and any dev server. `loadRoomsFromFirestore()` runs at startup, so
each run loaded every room ever created: **961** of them by 2026-07-29.

It did not fail noisily or randomly. On commit `493e560e` it reported **38/46 with 8 failures that
were precisely the original audit findings** — `hostAbandon`, `emptyResults`, `voterDrop`,
`rateLimit`, `identity`, `spectatorVote`, `aiFailure` ×2 — every one of which was fixed and
verified. Three checks never ran at all, because rooms wedged by earlier scenarios aborted them.

Same commit, minutes apart, three mechanisms:

| Condition | Result |
|---|---|
| 961-room accumulated DB | **38/46**, 8 "failures" naming the known bug list |
| empty DB | **49/49** |
| 961-room DB + isolation fix | **49/49**, dev DB byte-identical afterwards |

A gate that fails a working product is bad. A gate that fails it *by naming the bugs you already
believe in* is worse, because it survives scrutiny — I nearly reported eight regressions. Fixed:
`json.ts` honours `PLOTSLOP_DATA_DIR` (default unchanged; production must never set it) and the
harness forces a fresh `mkdtemp` per run and removes it on exit, alongside the same
forced-not-defaulted treatment already given to the API key and base URL.

*All four instrument findings — 9, 12, and the two in 10 — were caught the same way, and it is the
only way that works: the change and the instrument were verified against each other rather than
each against itself. Note that 12 surfaced only because a number moved for a reason I could not
explain, and I went looking instead of re-running until it looked right.*

---

## 11. plotslop.com — LIVE as of 2026-07-29

Jackson pointed DNS himself on 2026-07-29 and authorised the certificate step; everything past it
is still his.

**Done and verified:**
- `plotslop.com` → `187.77.218.14`, TTL 60, confirmed from the system resolver plus 1.1.1.1,
  8.8.8.8 and 9.9.9.9. `www` CNAMEs to the apex. **No AAAA, deliberately — do not add one.**
- Port-80 reachability proven from off-box (the MacBook) before certbot ran, not just locally.
- Bootstrap nginx site installed (`/etc/nginx/sites-available/plotslop.com`), `nginx -t` clean,
  reloaded. **sang3r.com re-checked immediately after the reload and still returns 200** — it
  shares this nginx and a bad config here takes it down, not just PlotSlop.
- Certificate issued for both names, staging dry-run first. Expires **2026-10-27**. Verified by
  reading the cert directly (`openssl x509`), not by trusting certbot's exit code; the private key
  was confirmed to match the certificate. `certbot renew --dry-run` for this cert passes.
  (Use `--no-random-sleep-on-renew` when testing — certbot's 0–600s pre-renewal sleep looks
  exactly like a hang.)
- The real config preserves `/.well-known/acme-challenge/` on both `:80` (ahead of the 301) and
  `:443`, so the swap in step 4 does not break renewal in 60 days.

**Not done, and deliberately left to Jackson:** steps 4–7 of `scripts/cutover.sh` — the TLS config
swap, installing the unit, and starting the service. Two Clerk secrets are still empty, so
`--check` still exits 1.

**One consequence worth knowing before someone visits the domain.** `https://plotslop.com` now
presents **chirpchirps.com's certificate** and throws a browser name-mismatch warning, because
DNS points here but no `:443` server block claims the name yet, so TLS falls through to another
site on the same IP. That state started the moment DNS flipped, not when the certificate was
issued — but it ends only at cutover step 4. Over plain HTTP the domain correctly returns
`plotslop: awaiting certificate`.
