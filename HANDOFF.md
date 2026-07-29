# HANDOFF — PlotSlop

**Written 2026-07-29 for a session that has never seen the preceding conversation.**
Read this before `AUDIT.md` (1100+ lines) or `CHUNKS.md`. Machine labels: `[VPS]` = this Linux
box, `[MACBOOK]` = Jackson's Mac over the tunnel.

---

## 1. Where things are

| | |
|---|---|
| **Canonical repo** | `/root/Plot-Twists` — Next.js 16 + Socket.IO game server. The game logic, AI layer, IP content library live here. |
| **Branch** | `audit/2026-07-28-snapshot` (tracks `origin/`). **Not** `master`, **not** `v2`. |
| **iOS repo** | `/root/PlotTwists-Native` — SwiftUI/tvOS. **Shelved.** See §6. |
| **Harness** | **49/49** — `[VPS] cd /root/Plot-Twists && ANTHROPIC_API_KEY=sk-ant-harness-fake npx tsx scripts/harness/run.ts` (~2 min) |
| **Unit suite** | **436/436** — `[VPS] npx jest`. All eight assertion-audit gates are now green. See §3 before you relax. |
| **Typecheck** | `npx tsc --noEmit` → **0 errors**. Keep it there; the types are load-bearing (§5). |
| **Current chunk** | **Chunks 2 and 3 complete** (2026-07-29). **Chunk 1** code-complete, cutover STAGED and unexecuted, blocked on Jackson. **🔴 Chunk 4 is REOPENED** — layer 1 did not do what it claimed; see §8. |

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

### 🔴 The IP fix is three layers, and LAYER 1 DID NOT DO WHAT IT CLAIMS.

Jackson's original correction still stands and is the most important non-obvious fact here:

1. Catalog rewrite of 252 named characters → archetypes
2. **Server-side validation that submitted card IDs resolve against the catalog**, with free
   text never interpolated into a system prompt
3. Output screening for named real people and owned franchises

**Layers 2 and 3 landed and hold.** Layer 1 did not, and this was only discovered on
2026-07-29 when the playtest packet made someone read the catalog. See §8. Do not repeat the
earlier claim in this file that all three landed — that claim was mine and it was wrong.

Still true, and now demonstrated rather than hypothesised:

- The layer 3 screen is a **deterministic term list**. It catches named entities and nothing
  else. "A wheezing tyrant in black armour who is secretly your father" passes it clean. That
  was written here as a hypothetical. `PLAYTEST-2026-07-29.md` shows it is the actual state of
  most of the catalog.
- Layer 2 removed the **"✎ Write your own" free-text card**. A user-visible feature removal
  that partly contradicts AUDIT.md Option B.
- **Runtime checks cannot see source files.** The layer-3 screen inspects generated scripts and
  the catalog tests inspect exported names; neither can see a comment. That is how four section
  comments naming franchises survived layer 1 with every check passing. Now gated by
  `__tests__/unit/lib/contentSource.test.ts`, which reads `lib/content.ts` as text.

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

## 6. iOS — shelved, with a blocking gate

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

## 8. 🔴 CHUNK 4 IS REOPENED — read this before touching the catalog

**Layer 1 did not do what it claims, and the record in this file said otherwise for a session.**

`b0277826` is described above as "375 catalog entries rewritten to archetypes". They were
rewritten to **paraphrase**, not archetype. Every entry is still an individually identifiable
description of the same protected character, and the catalog kept its franchise-by-franchise
ordering — the first eight characters are one sitcom ensemble in cast order, then another, then
the superheroes, then the space opera.

    "A noodle-shop panda who became a martial arts prodigy"
    "A cheerful fish with no short-term memory"
    "A grey wizard who arrives precisely when he means to"
    "A grumpy swamp ogre who just wants to be left alone"

Found 2026-07-29 by generating `PLAYTEST-2026-07-29.md` and reading 25 real dealt hands. Nothing
automated could have found it: layer 3 is a fixed denylist of NAMES and returns clean on all of
it, permanently.

**Why this may be worse than the original**, in Jackson's own framing about the poster briefs:
exposure is what you did, intent is what you wrote down about doing it. A description engineered
to evoke a character without naming it is the second thing.

**NOT fixed, deliberately.** A true archetype rewrite trades away exactly the recognisability
that makes the mashups land, and how much to trade is a product decision Jackson reserved. Top
item in `NEEDS-JACKSON.md`.

**What WAS fixed:** four section comments in `lib/content.ts` still named the franchise the
entries beneath them came from. Layer 1 deleted the `source:` field from all 375 entries and
never touched the comments. Now gated by `__tests__/unit/lib/contentSource.test.ts`, which reads
the file as TEXT — because every other IP check inspects runtime values and none of them can see
a comment.

---

## 9. Corrections to the record found on 2026-07-29

Four, and they are listed because the pattern matters more than any one of them: **the written
record has now been wrong about a completed item three sessions running.** Go looking.

1. **Chunk 4 layer 1** — above. Called complete; was paraphrase.
2. **The "2-minute PERFORMING sweep"** at `room.service.ts:463`, which CHUNKS.md item 3 and the
   harness both describe as ending an abandoned round with zero votes, is inside
   `loadRoomsFromFirestore` and **only runs at server startup**. During a live session nothing
   moved the room at all — the real behaviour was worse than recorded.
3. **Chunk 3 item 4 (Fisher-Yates)** was already closed by IP layer 2, which replaced the code
   path it points at. The biased idiom survived in three OTHER files the chunk did not list.
4. **`aiFailure` × 2 in the harness** were instrument artefacts, not defects: they asserted on
   two event names the server never emits, and their own failure text contradicted the state
   path printed beside it. Verified green with zero product changes.

One correction on the record: when the `publicId` approach was chosen, it was justified partly by
"`player.id` is `playerSessionId ?? userId ?? legacy_uuid`". **That was wrong** — that expression
is `sessionId`; `id` has always been `uuidv4()`. The Clerk `sub` leaked via `uid`, not via `id`.
The split still stands as defence in depth, but it was not removing a Clerk-sub leak.
