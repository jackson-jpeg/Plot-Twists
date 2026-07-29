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
| **Harness** | **38/46** — `[VPS] cd /root/Plot-Twists && ANTHROPIC_API_KEY=sk-ant-harness-fake npx tsx scripts/harness/run.ts` (~2 min; `voteTimerRace` waits out a real 60s timeout) |
| **Unit suite** | **425/430, 5 failing BY DESIGN** — `[VPS] npx jest`. See §3. |
| **Typecheck** | `npx tsc --noEmit` → **0 errors**. Keep it there; the types are load-bearing (§5). |
| **Current chunk** | **Chunk 1**, code-complete, blocked on Jackson. Chunk 2 not started. |

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

### 🔴 The 5 failing tests are the deliverable. Do not "fix" them.

An assertion audit (2026-07-29) swept all 398 tests and found **8 across 5 suites that encoded
known defects as expected behaviour**. They were green, and they read as coverage. All 8 were
inverted and are now **gates** — each goes green only when its chunk item lands.

**Three of the eight have since gone green, correctly**: the `validation.test.ts` D1 gates, when IP
layer 2 landed. That is what a gate is for. Five remain red — D2b ×2, D3b, middleware, and the
`subscriptions` missing-`game_error` handler.

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

### 🟠 The IP fix is three layers. Shipping any one alone is theater.

Jackson's correction, and the most important non-obvious fact in the project:

1. Catalog rewrite of 252 named characters → archetypes
2. **Server-side validation that submitted card IDs resolve against the catalog**, with free text
   never interpolated into a system prompt
3. Output screening for named real people and owned franchises

**All three landed 2026-07-29** (commits `8c1ca476` 4a, `5b383321` layers 2+3, `b0277826` layer 1).
Do not treat this as "IP done and dusted" — read `AUDIT.md` → *IP layer 1/2/3* first. In
particular:

- The layer 3 screen is a **deterministic term list**. It catches named entities and nothing else.
  "A wheezing tyrant in black armour who is secretly your father" passes it clean. A semantic pass
  is the follow-up and has not been built.
- Layer 2 removed the **"✎ Write your own" free-text card**. That is a user-visible feature
  removal, and it partly contradicts AUDIT.md Option B.
- The Chunk 4 done-criterion grep is a **fixed term list** and passed while the system prompt still
  named a living person four times. Do not treat a clean grep as a clean repo — screen with the
  layer 3 matcher as a second mechanism.

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

**Memory ceiling is measured, not guessed — but the measurement has a stated floor.**
`MemoryMax=768M` stands. `scripts/harness/load.ts` drives real rooms against a separately-spawned
server and samples only that subtree: **peak 334.7 MB at 20 rooms x 10 players (220 sockets)**,
44% of the ceiling. Two caveats that matter more than the number: 80% of that RSS is the idle Node
runtime (baseline 268 MB), and the mock Anthropic returns *instantly*, so real in-flight generation
pushes true peak higher by an unmeasured amount. Re-run with `npx tsx scripts/harness/load.ts 20 10 2`.

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

Six commits on `audit/2026-07-28-snapshot`:

| Commit | What |
|---|---|
| `10d990d2` | Assertion audit — 267 negative-assertion sites classified; 8 defect-encoding tests inverted |
| `57c5dc80` | CONSTRAINT-1 recorded with trigger + deploy practice |
| `1ceaff0d` | VPS isolation from Sanger — user, cgroup limits, `ProtectHome`, all verified by demonstration |
| `ed65c23f` | D2b serialisation boundary + generic leak guard (harness 16/28 → 19/29) |
| `9258b985` | Six unexercised paths driven (harness → 35/45) |
| *(this)* | This file |

**Not started:** Chunk 2 items 1–7 proper, Chunk 3, nginx/TLS/cutover.

One correction on the record: when the `publicId` approach was chosen, it was justified partly by
"`player.id` is `playerSessionId ?? userId ?? legacy_uuid`". **That was wrong** — that expression
is `sessionId`; `id` has always been `uuidv4()`. The Clerk `sub` leaked via `uid`, not via `id`.
The split still stands as defence in depth, but it was not removing a Clerk-sub leak.
