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
| **Harness** | **50/50** — `[VPS] cd /root/Plot-Twists && npx tsx scripts/harness/run.ts` (~2 min; it forces its own fake key and its own temp database, so pass neither). Two instrument bugs fixed 2026-07-29: the script-generation counter (§9 #9) and a **shared database that made it report 38/46 with eight fabricated failures** (§9 #12). If you see a number other than 50/50, read #12 before believing it. Denominator moved 49 → 50 on 2026-07-30 when the `playerCount` scenario gained a third check; the same pass turned two false greens in it into real assertions (§13). |
| **Unit suite** | **553/553** — `[VPS] npx jest`. Denominator moved 436 → 448 → 450 → 469 → 517 → 540: the source-audit suite grew 4 → 16 → 18 tests, 2026-07-30 added 19 seat-cap tests (`playerCounts.test.ts`) where previously **nothing asserted `MAX_PLAYERS` at all**, the same evening added 48 for the line budget and the cast binding (§14), 23 more late that night for the short speaker label (§15) — where, again, nothing asserted either — and 13 more on 2026-07-30 for `trust proxy` and for the A/B scaffolding guard (§17). Mostly coverage — but the three drift guards (real UI source in `playerCounts.test.ts`, real prompt text in `comedyPrompts.cast.test.ts`, real component source in `speakerLabel.test.ts`) are behaviour. See §3 before you relax. |
| **Typecheck** | `npx tsc --noEmit` → **0 errors**. Keep it there; the types are load-bearing (§5). |
| **plotslop.com** | 🟢 **LIVE 2026-07-29.** A → `187.77.218.14` TTL 60, `www` CNAME, no AAAA (deliberate — do not add one). Cert for both names expires **2026-10-27**. `plotslop.service` active and enabled on :3100 behind nginx TLS; apex and `www` return 200, HTTP 301s to HTTPS, sang3r.com verified unaffected. **Two clients have joined a room over the public endpoint.** **Cutover step 6: four of five boxes RUN AND PASSED 2026-07-30 with numbers (§17b).** Box 2 (deliberate OOM) is the only one outstanding, and box 1 already eliminates the failure class step 6 existed for. |
| **Current chunk** | **Chunks 2, 3 and 5 complete.** **Chunk 5 (the rename) DONE 2026-07-30** — see §12. `DECISIONS.md` #7 and #10 are both closed. **Chunk 4 layer 1 REDONE 2026-07-29** on Jackson's ruling — the catalog is restructured, not paraphrased; see §8. **Chunk 1** cutover APPLIED 2026-07-29 (steps 1-5, 7); step 6 is 4/5 boxes green (§17b). **Chunk 4 reversal DECIDED 2026-07-30: DO NOT REVERSE, on merit — the twelve scripts score 3–3 by arm, so the name arm does not win. Nothing reversed, product unchanged (§17a, and §4 of `CHUNK4-REVERSAL-ANALYSIS.md`).** The A/B answer protocol was found to be **inverted** before the verdict was read — a unanimous 6–0 for either arm would have tallied 3 A / 3 B and been misread as "no difference" (correction #28, §9). Verdicts tally **by arm, per pair, never by letter.** |
| **Deployed** | ✅ **LIVE as of 2026-07-30 20:17 UTC** — the short speaker label (§15) and the homepage poster wall (§16), on top of the 19:18 line-budget/cast-binding deploy. Verified in a real browser at two viewports, plus 16 routes curled with no 500s. Previously: ✅ **2026-07-30 18:38 UTC** — the seat-cap pass, on top of the 17:25 Chunk 5 deploy. Verified after the restart: apex/www 200, sang3r.com 200, zero errors in the journal, `ENSEMBLE:8` present in all three cap-bearing chunks **fetched over TLS** with zero `ENSEMBLE:6`, and all three OG image routes returning `200 image/png` — **including the invite card, which had been returning 500 since it was built** (§9 #24). |
| **Script length** | **42-52 lines, `max_tokens` 3,000** (`server/services/scriptCustomization.service.ts`). Jackson's ruling 2026-07-30, replacing 30-38 / 2,600 — triggered by his own rule that mean speaking lines per seated player at 8 must not fall under 5. Both branches of `generateScript` now READ that table rather than restating it. See §14. |
| **Cast binding** | **A script's `speaker` field is now the player's trait card, verbatim.** It was invented first names until 2026-07-30, which meant no line in any script had ever belonged to anybody in the room. `server/services/scriptCast.service.ts` enforces and measures it. **Read §14 before touching `comedyPrompts.ts`.** |
| **Speaker labels** | Displayed short, compared long. `lib/speakerLabel.ts` renders a unique prefix of the trait ("Reads every sign…"); every `===`, the text export and every `aria-label` keep the full string. **Shortening is a rendering concern; identity is not** — see §15. |
| **Deploy** | `[VPS] cd /root/Plot-Twists && bash scripts/deploy.sh`. **Two trees:** it builds in the source tree and rsyncs to `/srv/plotslop`, which is the unit's `WorkingDirectory`. Building in `/root/Plot-Twists` and restarting the service changes **nothing** and looks entirely successful — see §16. The restart prompt takes its EOF abort under a non-TTY: complete it by hand with `systemctl reset-failed plotslop && systemctl restart plotslop` after checking the window. **Do not pipe `y` into it.** |
| **Seating** | **ENSEMBLE seats 8 performers** (`server/utils/constants.ts`). Raised from 6 by Jackson's decision on 2026-07-30; the scope-freeze gate of "eight people who are not my friends" is now seatable. Every seat count in the UI derives from the constant via `lib/playerCounts.ts` — **do not restate one as a literal**, there is a test that fails if you do. See §13. |

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
  was written here as a hypothetical. `PLAYTEST-2026-07-30.md` shows it is the actual state of
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
| Playtest packet regenerated at **40 hands** against the new grammar | `PLAYTEST-2026-07-30.md` |
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

## 9. Corrections to the record found on 2026-07-29 and 2026-07-30 — twenty-eight of them

**Twenty-eight now, across seven passes** (13–24 are 2026-07-30; 25–27 are the late-evening
`speaker`-string pass; **#28 is the A/B protocol defect and is at the end of this section**),
and they are listed because the pattern matters more than any
one of them: **the written record has been wrong about a completed item five sessions running.**
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

### 2026-07-30 pass — six more

**13. The product cannot seat the number of people the scope freeze gates on.** The freeze reads
"eight people who are not my friends"; `MAX_PLAYERS.ENSEMBLE` is **6**. Nothing in any document
had connected the two. Full treatment in §13 — it is the most consequential item in this list
because it is a gate that cannot be passed as written.

**14. The `metadataBase` diagnosis was wrong, and so was the fix.** The record (NEEDS-JACKSON item
2, and §3 of the cutover report) says `NEXT_PUBLIC_BASE_URL` is unset so `metadataBase` "falls back
to the dead domain", and that the remedy is "one line plus a restart". Both are false:

- `next.config.js` declared `NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'` in its `env` block, which Next inlines at **build** time. Every
  `BASE_URL || APP_URL || <domain>` chain therefore stopped at the *second* term. The third term
  — the dead domain everyone was worried about — was unreachable dead code.
- The live site was serving `og:image="http://localhost:3000/opengraph-image"` and a sitemap of
  `http://localhost:3000` URLs. Confirmed by reading the response, not the source:
  `curl -s https://plotslop.com/ | grep og:image` and `curl -s https://plotslop.com/robots.txt`.
- Because these are `NEXT_PUBLIC_*`, they are baked into the bundle. **Setting the variable in
  `/etc/plotslop/env` and restarting changes nothing** — it needs a rebuild and a redeploy, which
  under CONSTRAINT-1 ends every game in flight. "One line plus a restart" understated it twice.

Fixed by `lib/siteUrl.ts` (one constant, `NODE_ENV`-aware) and by deleting the `next.config.js`
default. Verified against a real production build: sitemap and `robots.txt` now emit
`https://plotslop.com` and `og:image` is absolute on the right host, **with the env var still
unset** — so the fallback itself is now correct rather than merely overridable.

**15. The survivor table tracked one dead domain. There were four.** Appendix A item 11 greps only
`plot-twists.com`. Also live in the code, and missed by every pass:

| Domain | Where | Why it matters |
|---|---|---|
| **`plottwists.com`** | `HostLobby.tsx:253,310` | **Resolves to `156.254.10.135` — somebody else's server.** It is the join instruction printed on the host's screen at every party: "plottwists.com/join → CODE". Not a dead link; a live third party. |
| `plottwists.app` | `robots.ts`, `sitemap.ts`, both replay files, `user.handler.ts`, `JsonLd.tsx` | No DNS. Was the SEO canonical and the share-URL base. |
| `plottwists.live` | `poster-story`, `CharacterCardShare`, `DirectorsReview`, `ReferralCard` | No DNS. Watermarked into generated share images. |

The lesson generalises the one in §8: **a grep for the name you renamed *from* will not find the
names you never knew you had.** The inventory's rename table counted `plot-twists` variants and
never asked which domains the code actually prints.

**16. `PLAYTEST-2026-07-30.md` on disk is stale, and its headline cost figure is the pre-cap one.**
The committed packet is timestamped 18:23; `.real-generation.json` is 19:05 and
`scripts/playtest-packet.ts` is 19:20. The packet was never regenerated after the final run, so it
reports the scripts and costs from *before* the length cap landed:

| | committed packet | current data |
|---|---:|---:|
| script lines | 59–73 | 38, 38, 38 |
| round in / out | 3883 / 2763 | 4635 / 1787 |
| **cost per round** | **$0.0531** | **$0.0407** |

The `$0.0531` still appears in the current generator — as the hardcoded *before* column of the
length-cap comparison. Reading the committed `.md` gives you a "before" number labelled as the
current one. Confirmed two ways: recomputing from the artifact, and re-running the generator into
a scratch file and diffing. `.real-generation.json` is untracked, so this cannot be seen from git.

**17. `DECISIONS.md` #7's severity rested on a false premise.** It was "the top open item" largely
because `lib/firebase.ts` was said to initialise the client SDK in the browser, giving "a
client-reachable path, live right now". **Nothing imports `lib/firebase.ts`** — it is dead code,
and it self-guards on `isFirebaseConfigured` besides. Now closed moot on Jackson's ruling anyway,
but the ranking that put it first was wrong on its facts.

**18. A load-bearing code comment describes the opposite of what the code does.**
`scriptGeneration.service.ts:50-53` says *"scripts/real-generation.ts passes no customization and
takes the DEFAULT branch"*. It has passed `PRODUCTION_CUSTOMIZATION` since 2026-07-29 — the
artifact records `{"scriptLength":"standard",…}`. The comment exists specifically to stop someone
measuring the branch nobody plays, so it is the worst possible one to have inverted. Corrected.

*Two of these — 15 and 16 — were found only because a number or a name did not match the document
describing it, and the mismatch was chased rather than explained away. That is the same technique
that caught 12, and it is the only one in this list that generalises.*

### 2026-07-30, second pass — four more, and the worst one is mine

**19. 🔴 "The localhost OG bug is dead" was written after verifying the half that could not fail.**
`NEEDS-JACKSON.md` §0 and §1 of this file both declared the localhost URL bug closed, on the
strength of `curl https://plotslop.com/ | grep og:image` returning an absolute URL on the right
host. That check was real, and it covered `/opengraph-image` — **the one image route that does not
fetch anything.** Four sibling routes did:

```
app/join/invite/[code]/opengraph-image.tsx    ← the INVITE-LINK card. The join path.
app/api/poster-story/[gameId]/route.tsx
app/api/character-card/[gameId]/[playerId]/route.tsx
app/api/clip-card/[gameId]/route.tsx
```

Each wrote its own `process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'`. `NEXT_PUBLIC_WS_URL`
is **not set** in `/etc/plotslop/env`, and `NEXT_PUBLIC_*` is inlined at build time, so the literal
was baked into the production bundle. Confirmed two ways:

1. `systemctl show plotslop` → the unit's `PORT=3100`.
2. `curl -s http://localhost:3000/ | grep '<title>'` → **`<title>Jackson Sanger</title>`**, versus
   `:3100` → `<title>PlotSlop - AI Improv Party Game</title>`.

**Port 3000 on this box is sang3r.com.** Every one of those four fetches went to Jackson's personal
site, 404'd, and the card fell back to its generic form. It failed *quietly* — an invite preview
that still renders something looks fine — which is why no check caught it.

Two of those four files **already imported `SITE_DOMAIN`** from `lib/siteUrl.ts`: the Chunk 5 sweep
opened them, fixed the domain they *displayed*, and left the domain they *fetched*, because a grep
for dead brand names does not match "localhost". Fixed by adding `API_ORIGIN` to `lib/siteUrl.ts`
and routing all four through it.

**The generalisable part:** "I verified it" is not the same as "I verified the thing that was
broken". The claim should have been *"the root OG card is fixed"*, which is what was tested.

**20. `SocketContext.tsx:121` built `https://localhost:3000` in the production bundle.** The SSR
branch fell back to the literal `'localhost:3000'` and then prefixed it with `https://` — a value
that can never connect. Only the SSR path, so no user-visible failure, but it was in the shipped
JS. Now `API_ORIGIN`.

**21. The seat-cap blast radius undercounted the UI 4×, and named the wrong file.** Detail in §13.
Twelve sites, not three; three of them were not strings; and the cited `opengraph-image.tsx:34` is
in `app/join/invite/[code]/`, not `app/`, which matters because `app/opengraph-image.tsx` had a
*separate* hardcoded count nobody had found.

**22. "Silently demoted to SPECTATOR" was asserted in two places and was false in both.** The
joiner has always been told — toast plus a full "Spectator Mode" lobby state. The **host** was not.
Detail in §13.

**23. `INVENTORY.md`'s tuning-constant table was stale in two ways, one of them by 4×.** Found
while updating it for the new cap — by reading the table against the source rather than trusting it:

- `VOTING_TIMEOUT` listed as **60_000 ms**. It has been **25_000** since Chunk 2.
- `AI_MAX_TOKENS = { ENSEMBLE: 10000, DEFAULT: 8192 }` listed as a live tuning constant. **Nothing
  imported it** — a repo-wide grep returned only its own declaration. The real output ceiling is
  **2,600**, applied by `getMaxTokens()`, and it is a number Jackson chose deliberately. A dead
  constant sitting in the inventory claiming 10,000 is a trap for exactly the kind of session that
  reads `INVENTORY.md` to find out what the limits are. Both corrected; the dead constant is
  deleted from `constants.ts`, with a note where it stood.

**24. 🔴 The invite-link OG card has returned HTTP 500 since the day it was built, and #19's fix
was never reachable.** Found by curling the deployed route after the restart rather than trusting
that a rebuilt page renders:

```
GET https://plotslop.com/join/invite/TEST/opengraph-image  →  500
⨯ TypeError: Cannot read properties of undefined (reading 'toUpperCase')
```

`params` is a **Promise** in Next 15+. `app/join/invite/[code]/opengraph-image.tsx` destructured it
synchronously — `params.code.toUpperCase()` — from the commit that introduced the invite feature
(`d81091f2`). Every sibling route in the repo already awaits it. So the join-path link preview has
never rendered at all: not a degraded card, **no card**.

**And it lands on #19.** The throw happens two lines *above* the fetch, so the `localhost:3000`
bug fixed there had never actually been reached in that file. Two real defects stacked in one
route, and the outer one hid the inner one.

`app/replay/[code]/opengraph-image.tsx` has the identical mistake with a different symptom: inside
a template literal `params.code` is `undefined` rather than a throw, so it fetched
`/api/game/undefined`, got a non-ok response, and quietly rendered the generic card. **A hard 500
and a silent degradation out of the same one-word omission.** Both fixed, both verified over TLS:
invite `200, image/png, 117 KB`; replay `200, image/png, 117 KB`.

**Why this one is the sharpest lesson in the list.** #19 was "I verified the wrong half." #24 is
worse: I verified that the *file* was correct — it typechecked, it built, the right string was in
the bundle — and never asked the deployed route for a response. `tsc`, `jest`, `next build` and a
grep of the shipped JS were all green on a route that returns 500 to every caller. **Compiling is
not responding. Curl the endpoint.**

*The pattern across 19-24: every one is a claim about a thing being absent or handled, written
from one side of a boundary and never checked from the other. 19 checked the server's output but
not the routes that call it; 22 checked the server's ack but not the two clients that render it;
23 was a table nobody had re-read against the file it describes; 24 checked that code was built
but never that it ran.
**When the record says "X is handled", find the code that consumes X, not the code that emits it.***

---

### #25 — "4.71 mean lines per player" was 0.00, and the instrument assumed the bug away

Reported this morning, in `NEEDS-JACKSON.md` item 1 and §13, as the measured answer to Jackson's
threshold question. It was computed as `total script lines / seat count`, which quietly assumes
that a speaker in the script is a player in the room. **No speaker was.** The model was returning
invented first names and a player's identity is their verbatim trait card, so the true figure was
**0.00 lines per player in all three scripts** — 113 of 113 lines belonged to nobody.

The distribution *shape* I reported was real and the recommendation it produced was right, so the
conclusion survived. The number did not. A metric that divides by a denominator it never checks
the numerator against is not a measurement. See §14.

### #26 — the playtest packet praised the defect in prose

`scripts/playtest-packet.ts` told Jackson, admiringly: *"Nobody told the model to name the
characters. It derived a speaker name from each trait on its own… That is the grammar doing what
it was supposed to do."* That paragraph is a description of the bug in #25, written as a design
win, printed in the artefact he was asked to read before a playtest. Rewritten.

### #27 — the +15% cost forecast was wrong by more than a factor of two

`NEEDS-JACKSON.md` item 1 projected `$0.0400` → `~$0.0437`. Measured after the change: **$0.0550,
+37.5%.** The forecast modelled the line-budget change only. It did not model the cost of the
*other* change in the same recommendation — a ~500-token cast list on input, and a ~50-character
speaker label on the output of every line (+7 tokens/line). **I forecast the change I was
recommending and not the change I was about to make.**

*The pattern across 25-27 is one step further than 19-24. Those were claims checked from the wrong
side of a boundary. These are three places where the instrument, the artefact, and the forecast
all agreed with each other and all three were wrong together, because they shared an assumption
none of them tested — that a `speaker` string means a person. **Agreement between your own
instruments is not corroboration when they share a premise.***

### #28 — the A/B answer protocol inverted the result it was built to measure

**Found by Jackson 2026-07-30, from the rendered packet rather than from any metric.**

`AB-PACKET.md`'s header claimed *"whatever A is in pair 1, it is in pair 6"* and asked for **one
letter** as the answer. `CHUNK4-REVERSAL-ANALYSIS.md` §3 carried the same claim and contradicted
itself inside a single sentence: *"A and B are consistent across all six pairs, the assignment is
a fixed 3/3 split."* **A fixed 3/3 split IS a per-pair re-draw.** The two halves of that sentence
cannot both be true.

**The data was never wrong.** Derived from the rendered text — first speaker label of each arm in
each pair — the assignment is `name, trait, name, name, trait, trait`, which matches
`.ab-key.json` and the hardcoded `A_IS` in `scripts/ab-packet.ts` exactly. Verified all three
ways. Nothing needed re-deriving.

**What made it a measurement defect rather than a wording nit:** with A as the name arm in
exactly three of six pairs, a **unanimous 6–0 preference for either arm tallies BY LETTER as 3 A
/ 3 B** — and the pre-registered reading of 3–3 was *"prices the question at zero, freeze holds
by default."* The instrument returned **"no difference" exactly when the answer was
"unanimous."** On the live data it distorted the other way too: the observed genuine 3–3 by arm
tallies 4 A / 2 B by letter, reading as a two-vote lead that does not exist.

**Root cause, and it is one word.** `A_IS` is a hardcoded literal and its comment called that
"fixed", meaning *not randomised at runtime*. Downstream prose read "fixed" as *the same arm in
every pair*. One ambiguous word, propagated into a header, a protocol, and an analysis.

**Fixed in all three files:** the emitted header in `scripts/ab-packet.ts`, the rendered
`AB-PACKET.md`, and §3 of `CHUNK4-REVERSAL-ANALYSIS.md`. The answer form is now **one verdict per
pair, tallied by arm, never by letter.** `.ab-key.json` was deliberately **not** regenerated —
re-running the generator would rewrite it and destroy the timestamp that is its tamper-evidence.

*This is the same shape as the stale margin table — a guard watching the wrong input — but one
layer deeper: it was inside the measurement rather than inside the thing measured. **A blind
protocol has to be checked against the artefact it renders, not against the intent of whoever
wrote it.** Note also that #25-27 were caught by instruments; #28 was caught by reading the
output. Two of this session's most useful findings — this and the Scooby-Doo performance hazard
logged in `CHUNK4-REVERSAL-ANALYSIS.md` §4 — came from the packet and from no metric at all.*

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

---

## 12. Chunk 5 — the rename, DONE 2026-07-30

**Goal from `CHUNKS.md`:** PlotSlop everywhere on web, iOS excluded. Gate was `DECISIONS.md` #10,
which Jackson closed on 2026-07-30. Gates re-verified after: **450/450 · 49/49 · tsc 0 errors**,
plus a real `next build` (exit 0) because three of the changes only manifest in a build.

### What changed

| Area | Change |
|---|---|
| **Brand copy** | 103 occurrences of `Plot Twists` → `PlotSlop` across 45 files. |
| **The bit** | Root/OG/Twitter descriptions, PWA manifest, `/join` `/explore` `/profile` descriptions, onboarding. Titles keep "improv/comedy/party game" — the SEO surface should not pay for the joke. `comedyPrompts.ts` untouched, verified by diff. |
| **Four dead domains** | Not one. See §9 #15 — `plot-twists.com`, `plottwists.com` (**someone else's server**), `plottwists.app`, `plottwists.live`. All now resolve through `lib/siteUrl.ts`. |
| **CORS** | `plot-twists.com` + `www.` removed (Chunk 5 step 6 — the cutover has settled). Railway removed with them: trial ended, returns 404, `DECISIONS.md` #5 moved the deploy here. Vercel preview regex narrowed to `plotslop` only. |
| **Legal pages** | Privacy and Terms renamed, `privacy@`/`support@` → `plotslop.com`. Refund line fixed per Jackson's ruling — **plus three more stale Apple/iOS claims the item did not mention** (see `DECISIONS.md` #10). |
| **Install prompt** | Option A. `/join` and `/game` suppressed. Note `/game` is not currently a route — `GameShell` renders under `/join`, so the player path was already covered; the entry is future-proofing. |
| **Shells** | Android deep-link host and display name; the Capacitor `webcredentials:` entitlement, which was **a security item**, not cosmetics — it pointed at a domain being allowed to expire (`CHUNKS.md` #13-15). |
| **Service worker** | `CACHE_NAME` `plot-twists-v2` → `plotslop-v3`. The bump is load-bearing: without it an installed PWA keeps serving the pre-rename shell. |

### Deliberately NOT renamed

- **`localStorage` keys** (`plottwists_active_room`, `plottwists_player_session_id`,
  `plottwists_reconnect_*`, `plot-twists-theme`, `plot-twists-install-dismissed`). They are
  invisible to users, and two of them are the **guest reconnect credential** — renaming those
  silently breaks reconnection for anyone holding a live session, which is the exact failure
  Chunk 2 item 5b existed to fix. A rename here buys nothing and costs a reconnect bug.
- **Registered store identifiers** — `com.plottwists.app`, `merchant.com.plottwists.app`,
  `com.plottwists.credits.*`. These are identities registered with Apple and Google, not strings.
  `DECISIONS.md` #2 already defers them by not renaming.
- **`ios/App/` Capacitor Swift sources** (`PlotTwistsViewController`). iOS is excluded from this
  chunk and the class name is coupled to the storyboard and `pbxproj`. The *domains* in that tree
  were fixed because those are a security item; the identifiers were not.
- **`docs/`, and every `*.md`.** They are historical records and correctly describe the old name.

### Deployed 2026-07-30 17:25 UTC

Jackson ran it the same day. `deploy.sh` built, synced and pruned, then **took its abort path at
the restart prompt** — stdin was not a TTY, `read` got EOF, and it refused to assume consent rather
than defaulting to yes. He ran `reset-failed && restart` himself. The guard worked as designed, and
that is worth knowing before anyone "fixes" the prompt to be non-interactive.

Before the restart the window was confirmed empty rather than assumed: zero live socket
connections, `rooms.json` = `items: []`, no game activity in two hours. Post-deploy verification
table is in `NEEDS-JACKSON.md` §0 — including the check a curl cannot make, two clients sharing a
room over public TLS on the new build.

---

## 13. Seating — ✅ DECIDED AND SHIPPED 2026-07-30. `MAX_PLAYERS.ENSEMBLE = 8`.

**Jackson raised the cap to 8.** The scope-freeze gate — *"played this with eight people who are
not my friends"* — is now a shape the product can actually seat. The investigation that led here is
below the fold; read the outcome first.

### What changed

| | |
|---|---|
| `MAX_PLAYERS.ENSEMBLE` | **6 → 8** (`server/utils/constants.ts`) |
| `MIN_PLAYERS` | **New export.** The floor (`SOLO 1 / H2H 2 / ENSEMBLE 3`) now lives beside the ceiling. `matchmaking.service.ts` had its own private copy as `AUTO_START_THRESHOLD`; it is now an alias for the shared one. |
| `lib/playerCounts.ts` | **New.** `seatRange`, `seatRangeLabel`, `performersLabel`, `ALL_MODES_PLAYER_RANGE_LABEL`, `FALLBACK_MAX_PLAYERS`. Every seat count shown to a human comes from here. |
| The UI | **Nothing states a count as a literal any more.** See the table below — there were more of them than the previous version of this section claimed. |
| Tests | `__tests__/unit/server/utils/playerCounts.test.ts` — **19 new assertions**, including a drift guard that reads the real UI source. Unit suite **450 → 469**. |
| Harness | `playerCount` rewritten; `spectatorVote` de-hardcoded. **49 → 50 checks.** |
| Playtest artefacts | Re-run against the live API at 8. `PLAYTEST-2026-07-30.md` → **`PLAYTEST-2026-07-30.md`**. |

### 🔴 The previous version of this section undercounted the UI work by 4×

It said *"three hardcoded numbers, all strings"*. Both halves were wrong. There were **twelve**
sites across nine files, and three of them were not strings:

| File | Was | Now |
|---|---|---|
| `HostLobby.tsx:338` | `Max {gameMode === 'HEAD_TO_HEAD' ? 2 : 8}` | `Max {maxPlayers}` |
| `HostLobby.tsx:502-504` | `'1 player vs AI'`, `'2 performers + host'`, `'3-6 performers + host'` — **three** literals, not one | `performersLabel(mode)` |
| `HostLobby.tsx:111-133` | `canStartGame` and `getMinPlayers()` each restated the floor as `2`/`3` | `MIN_PLAYERS[gameMode]` |
| `JoinForm.tsx:711` | `'3-6 performers'` | `performersLabel('ENSEMBLE')` |
| **`app/opengraph-image.tsx:99`** | **`'1-6 Players'`** — the ROOT marketing OG card. Missed entirely by the previous sweep. | `ALL_MODES_PLAYER_RANGE_LABEL` |
| `app/join/invite/[code]/opengraph-image.tsx:34` | `?? 8` (the previous section cited this as `opengraph-image.tsx:34`, which is a different file) | `FALLBACK_MAX_PLAYERS` |
| **`room.handler.ts:355`** | **`activePlayers.slice(0, 6)`** — not a string, and it would have silently dropped two names from every invite preview at the new cap | `slice(0, maxPlayers)` |
| **`matchmaking.service.ts:22`** | a second copy of the floor | alias of `MIN_PLAYERS` |
| `scripts/real-generation.ts:54` | `const PLAYERS = 8` | `MAX_PLAYERS.ENSEMBLE` |
| **`scripts/harness/run.ts:758`** | `length: 6` in `spectatorVote` | `MAX_PLAYERS.ENSEMBLE` |

The lesson for the next sweep: **grepping for the number you expect finds the sites you already
know about.** `'1-6 Players'` and `slice(0, 6)` both survived a sweep that was looking for `3-6`
and `Max 8`. What found them was grepping for the *shape* (a digit adjacent to a player noun) and
then reading every reader of the constant.

### 🔴 "Silent demotion" was wrong, and the previous record asserted it twice

`NEEDS-JACKSON.md` and the harness message at `run.ts:624` both said an overflow joiner is
*"silently demoted to SPECTATOR"* and that *"the UI must surface the role or they think they are
playing"*. **The joiner has been told all along:**

- `JoinForm.tsx:259` — `toast.info('Room is full! You joined as a Spectator.')`
- `JoinLobby.tsx:79` — the lobby headline renders **"Spectator Mode"** with an eye icon, and
  `:89` explains *"Sit back and enjoy the show! You can vote at the end."*

The party that was **not** told was the **host**. `HostLobby.tsx:109` built its cast list as
`players.filter(p => !p.isHost)` — spectators included. So the host saw `Cast (9)` under `Max 8`
with no indication that two of those people would never appear in the script, and the same count
fed `canStartGame`. Fixed: the cast is `role !== 'SPECTATOR'`, and spectators render in their own
**Audience (N)** group with the line *"The cast is full at 8, so they watch and vote instead of
performing."*

This is the shape the record keeps getting wrong: an assertion about a missing thing, written from
the server's point of view, never checked against the client that consumes it.

### The harness gate was a false green in two ways

```
-  record('playerCount', 'ENSEMBLE caps PLAYER seats at 6', asPlayer <= 6, ...)
+  record('playerCount', `ENSEMBLE seats exactly MAX_PLAYERS (${CAP}) — no more, and no fewer`,
+    asPlayer === CAP, ...)
```

1. The cap was hardcoded as `6` while `MAX_PLAYERS` was the thing under test.
2. **`asPlayer <= 6` is satisfied by `asPlayer === 0`.** A server that refused every joiner passed
   this gate. It is now an equality, and the scenario over-joins by 2 so the spectator path is
   still exercised at any cap.

**And a second hardcoded 6 that no grep found.** `spectatorVote` filled the room with
`length: 6` clients so the 7th would overflow. At a cap of 8 the "spectator" joined as a PLAYER and
every spectator assertion below it stopped measuring a spectator. It surfaced only because the
harness went **red** when the cap moved — which is the entire argument for making test fixtures
derive from the constant rather than restate it.

### Is the new cap real? Confirmed two ways, per rule 2.2.

**Mechanism 1 — a live room**, 10 clients through the real handlers:

```
10 joiners → 8 PLAYER, 2 SPECTATOR, 0 rejected
```

**Mechanism 2 — the shipped bundle.** `grep` over `.next/static/chunks/*.js` finds `ENSEMBLE:8`
and **zero** occurrences of `ENSEMBLE:6`. Neither `'3-6 performers'` nor `'1-6 Players'` appears
anywhere in the built JS — they cannot, because no call site holds a literal any more.

### What raising it actually touched — the blast-radius prediction held

Every ❌ in the pre-change prediction was correct: `MIN_PLAYERS` is a floor and did not move, the
30-38 line budget and the 2,600 `max_tokens` ceiling are constants, card dealing is per-room, and
voting/results/progression iterate the player map. The prediction's only error was undercounting
the UI, above.

### The measurement that decides what comes next: 4.71 lines per player

Re-run at 8 against the live API (`PLAYTEST-2026-07-30.md`, "How much each player actually says"):

| | |
|---|---|
| **Mean per seated player** | **4.71 lines** — under Jackson's stated threshold of 5 |
| **Median across every speaker** | **3.5** |
| Range | **2 - 12** |
| Distinct speakers per script | 9, 8, 9 — **against 8 traits** |

**The mean is the flattering number.** The model does not divide the budget evenly: one character
took 11 of 38 lines in one script and 12 of 38 in another, while three speakers got 2. And two of
the three scripts invented a **ninth** character, whose parts still have to be read by someone.

Per Jackson's rule — *"if it's under 5, the fix is raising the 30-38 line budget, NOT lowering the
cap back"* — the recommendation is in `NEEDS-JACKSON.md` item 1. **Not applied. He asked for a
number, not a change.**

### Cost, re-measured at 8

| | |
|---|---:|
| script generation (mean of 3) | $0.0353 |
| director's review | $0.0047 |
| **one complete round** | **$0.0400** |

Against `$0.0407` at the previous measurement — statistically the same, which is the expected
result: the prompt is fixed-size and the line budget is a constant, so cast size barely moves it.
$9 of credit still buys ~225 rounds.

**Superseded 2026-07-30 evening.** Jackson approved the budget change and ordered the
per-character instruction applied without waiting for a playtest. Everything above about
distribution is still the correct *shape* of the finding, but the per-player numbers in it are
wrong for a reason nobody had checked — see §14.

---

## 14. Line budget, cast binding, and a part that belonged to nobody — 2026-07-30 evening

### What Jackson asked for

> *"Line budget: apply 42-52, max_tokens 2,600 → 3,000. Approved. Also apply the per-character
> instruction now — don't wait for the playtest. [1] A minimum line-share per seated character. No
> speaker below 3. [2] Exactly the seated cast, no invented characters. Then re-run three
> generations and report: median, range, and speaker count vs cast size. Acceptance is median >= 5
> and no speaker below 3."*

**All of it is applied and all of it passes.** Acceptance met: **median 6, minimum 4, zero
invented characters in three of three scripts.**

### 🔴 The thing found on the way, which is bigger than the thing asked for

`components/MobileTeleprompter.tsx:99` decides whose phone says YOUR TURN:

```ts
const isMyTurn = currentLine.speaker === myCharacter
```

`myCharacter` is set in `stores/subscriptions.ts:159` to `selection.character.name` — **the
verbatim text of the trait card the player picked**, e.g. `Insists nothing is wrong at increasing
volume`. And the prompt was handing the model a list of traits with an output format whose example
read `"speaker": "Character Name"`, so the model did the sensible thing and invented first names.

Measured across the three live generations in the previous `.real-generation.json`: speakers were
`Marcus`, `Denise`, `New Riley`, `Paulo`, `Jen`, … and **zero of eight traits matched in any of the
three scripts.** Not "sometimes" — zero, three times out of three.

**So every part in every script ever generated belonged to nobody, and YOUR TURN has never fired
for any player since the teleprompter was written.** There is no other mechanism that binds a
written part to a person: the host screen prints `line.speaker` raw, and nothing else compares it
to anything.

This is also why §13's "4.71 mean lines per player" was wrong. That number divided script lines by
seat count, which silently assumed a speaker is a seated player. Attributed properly against the
cast list, **the true figure was 0.00 for every player in all three scripts.**

### What changed

| File | Change |
|---|---|
| `server/services/scriptCustomization.service.ts` | `standard` band 30-38 → **42-52**; ceiling 2,600 → **3,000** |
| `server/services/scriptGeneration.service.ts` | Both branches now READ that table instead of restating it as literals; calls the cast binder after validation |
| `server/services/prompts/comedyPrompts.ts` | ENSEMBLE gets a closed CAST LIST carrying the trait strings verbatim, RULE 1 (nobody else exists) and RULE 2 (nobody under 3 lines). HEAD_TO_HEAD gets the same verbatim rule for two. SOLO gets it for the human only |
| `server/services/scriptCast.service.ts` | **NEW.** Snaps near-miss speaker labels onto the cast, reports off-cast parts, silent players and per-seat line counts |
| `scripts/playtest-packet.ts` | The distribution section now attributes against the cast list rather than counting distinct speakers |

**SOLO is deliberately exempt from "no invented characters".** The entire mode is one human against
2-3 characters the model creates for the setting. `logCastBinding` logs off-cast speakers at
`debug` for SOLO and at `warn` everywhere else. If you ever "fix" that inconsistency you will
break SOLO.

### The snapper is not decoration

Script 2 of the re-run needed **6 speaker labels snapped** onto the cast — the model varied
punctuation or casing on 6 lines. Without the snapper those 6 lines would have failed `===` and
gone unassigned, in a run that otherwise looks perfect. A prompt instruction is not a guarantee;
this is the part that makes the binding robust rather than lucky.

### Measured, three live generations, 8 seats

| | before | after |
|---|---:|---:|
| lines per script | 37.7 | **51.3** |
| mean per seated player | **0.00** | **6.42** |
| median | 0 | **6** |
| range | 0-0 | **4-12** |
| distinct parts vs 8 seats | 9 / 8 / 9 | **8 / 8 / 8** |
| lines belonging to nobody | **113 of 113** | **0** |
| reading time at 120 wpm | 1.8 min | **2.7 min** |
| **cost per round** | **$0.0400** | **$0.0550** |

### The cost went up more than was forecast, and the forecast was mine

`NEEDS-JACKSON.md` projected ~15% (`$0.0400` → `~$0.0437`). It is **+37.5%**. Two causes, neither
of them the line budget:

1. **Input tokens 4,377 → 4,908.** The cast-list block is ~500 tokens of prompt.
2. **Output tokens per line 39.2 → 46.3.** Every line now carries a ~50-character speaker label
   instead of a 6-character first name. That is ~11 extra output tokens on every single line.

Both are the cast-binding change, not the budget. Forecasting only the output growth from
38 → 52 lines was the error: the budget change alone would have landed near the 15% predicted.
$9 of credit now buys **~164 rounds** rather than ~225.

### Quality — read this before assuming the prompt change was free

Jackson asked to be told plainly if the scenes got stiff or evenly boring. **They did not.** Line
length held (6.29 words/line, longest 14, no essay-mode drift), the traits drive the voices harder
than before, and the scenes still have a lead — the busiest seat took 12, 10 and 9 lines. The
floor is what moved, not the shape.

The one visible cost is cosmetic and it is real: **speaker labels on the teleprompter are now
sentences, not names.** `MobileTeleprompter.tsx:226-236` renders them at 13px uppercase mono,
centred, and a 50-character trait wraps to two or three lines above every single line of dialogue.
It is legible and it is uglier. Not changed — it is a design call and it is Jackson's.

**→ ANSWERED 2026-07-30, late: shorter display form, binding kept. See §15.**

---

## 15. The short speaker label — 2026-07-30, late

Jackson's answer to the question §14 left open: *"Do the shorter display form, keep the binding."*

`lib/speakerLabel.ts` shortens what is **displayed**. Nothing else changes. The rule the whole
design rests on, and the thing to preserve if you touch any of this:

> **Shortening is a rendering concern. Identity is not.**

| Keeps the full trait string | Shows the short label |
|---|---|
| `MobileTeleprompter`'s `isMyTurn` (`components/MobileTeleprompter.tsx:99`) | the current-line speaker |
| `app/clips/page.tsx:36`, `app/digest/page.tsx:40` — winner and per-player attribution | the "Up Next" footer |
| `lib/scriptUtils.formatScriptAsText` — the archival copy a player shares | the host screen, per line and in the cast list |
| every `aria-label` — assistive tech gets the whole card | the replay viewer, both views |

**It is a PREFIX, not a summary, and that is deliberate.** The player is holding the card. A prefix
is something they can match against what is in their hand; an extracted noun phrase ("A
NEGOTIATION") is not. Prefixes are also deterministic, which is what makes the uniqueness guarantee
below possible at all.

### The failure mode this could have introduced, and how it is prevented

Two traits in the live deck share an opening — *"Has already searched your bag"* and *"Has already
named the children"*. If both collapsed to the same label, the teleprompter would show one player's
cue to another. **That is a worse bug than the wrapping it replaces.** So colliding labels grow one
word at a time until they separate: uniqueness beats brevity whenever the two conflict, and the
growth loop terminates even when two speakers are genuinely inseparable.

Measured on the three real 8-trait casts in `.real-generation.json`: 45-character traits become
17-26 character labels, one line each at 13px, all eight distinct in all three scripts.

`STAGE_DIRECTION_SPEAKERS` moved to `lib/speakerLabel.ts` and `scriptCast.service.ts` re-exports it.
Both sides must agree on what counts as a person; two copies would drift, and the drift would show
up as a stage direction quietly reported as a seated player with no lines. Client components cannot
import from `server/`, so the shared definition has to live in `lib/` and not the other way round.

### Verification

23 tests in `__tests__/unit/lib/speakerLabel.test.ts`. Suite 517 → **540**. Both guards proved
non-vacuous per rule 2.2, by injection:

- neutering the growth loop turned the collision test red;
- swapping `isMyTurn` to compare the **label** turned the source-scan test red.

Exactly those two, nothing else. Restored and re-greened.

The last describe block reads component source as **text**, because the display/identity separation
cannot be observed at runtime — a future edit that swaps `labelFor(...)` into the `===` would pass
every behavioural test in the file.

### 🔴 What is NOT verified

**No rendered teleprompter on a real game.** Same wall as §14: no game has been completed on the
deployed instance (`/srv/plotslop/data/` holds no `gameHistory.json`), and the credit gate stops an
anonymous host generating one. What *is* proven is that the code reaches browsers — the served
chunk `https://plotslop.com/_next/static/chunks/3oh64kd_0kthm.js` contains the compiled
`/^\s*someone\s+who\s+/i` wrapper regex. Disk presence and a served bundle are two mechanisms;
neither one is a rendered label. **One signed-in round closes it.**

---

## 16. The homepage poster wall — 2026-07-30, late

**Six empty gradient placeholders, fixed by deleting the image slots rather than by making images.**

Chunk 4a deleted `public/poster-showcase/` — six rendered PNGs of named third-party characters —
and left `imagePath?` behind on `HomepageShowcaseEntry` against artwork that was never generated.
Nothing ever set it, so `{imagePath && <img/>}` never mounted and the 2:3 thumbnail stayed a bare
gradient rectangle. **Live for two days.**

Confirmed two ways before touching anything, per rule 2.2: the code path read end-to-end, and the
live DOM (`imgCount: 0`; six thumbnail divs with zero children and a pure `linear-gradient`
background). Curling the page is **not** enough here and this is worth knowing — the homepage is
client-rendered behind an auth check, so `curl` returns a 25 KB skeleton containing the word
"PlotSlop" and nothing else. It takes a real browser to see this page at all.

### Why not generate posters

Costed both, because Jackson asked which was cheaper before the work started. Gemini would have
been ~$0.24 for six images. That is not where the cost is:

- `scripts/generate-homepage-posters.ts` and the briefs were both deleted in 4a — both would be
  rewritten;
- the six archetype titles map one-to-one onto the characters 4a removed, so any brief detailed
  enough to produce a good poster is a brief that has to be **defended** — and briefs-as-evidence-
  of-intent is precisely what 4a deleted;
- it puts ~11 MB back in the repo and a "review six images for IP leakage" item back on Jackson's
  queue;
- Chunk 7 redesigns this section anyway.

**The deciding factor was not the $0.24. Generating artwork re-opens the question 4a closed three
days earlier.**

### What changed

`imagePath` is **gone from the interface**, not left optional-and-unset — an unset optional reads
as "artwork is coming" and it is not. The hero card lost its `<img>` and `imageFailed` state; the
80px thumbnail column became a 3px accent rule. The card is `display:flex` and its content box is
`flex: 1`, because the grid stretches the card to the sidebar's height and without that the content
stopped at its own `minHeight` and everything below it was bare gradient — the exact look being
removed.

**This is not the homepage design pass.** That is Chunk 7, logged in `BACKLOG.md` with Jackson's
four findings, and nothing here touches any of them.

### Deployed 2026-07-30 20:17 UTC

Verified in a real browser at 1280px and 390px: zero `<img>` elements, six rows, `3px` grid column,
no horizontal overflow. 16 live routes curled, **no 500s**.

### 🟠 The deploy has two trees, and building in the wrong one looks like success

`npm run build` in `/root/Plot-Twists` followed by `systemctl restart plotslop` **does nothing.**
The unit runs `WorkingDirectory=/srv/plotslop`; the source tree is only an input. `scripts/deploy.sh`
builds in the source tree and then **rsyncs to `/srv/plotslop`**, and it is the rsync that matters.

Caught tonight only by loading the page in a browser after restarting and finding the old layout.
Every gate was green and the service was healthy. Both trees also need the env sourced —
`next build` fails without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, which is documented at the top of
`deploy.sh` and is easy to hit when invoking `npm run build` by hand.

---

## 17. Chunk 4 reconsidered, cutover step 6, and `trust proxy` — 2026-07-30, late

Three unrelated things. The first is analysis Jackson asked for and **no product change**; the
other two are queue items that stopped being his under a new operating rule.

### 17a. The Chunk 4 reversal question — analysed, nothing reversed

Full write-up: **`CHUNK4-REVERSAL-ANALYSIS.md`**. Blind packet: **`AB-PACKET.md`**, on Jackson's
Mac, **deliberately not committed**.

The design under consideration: genre category slots ("a 90s sitcom character") that the player
fills by typing a name; the slot ships, the name never does; anything leaving the room renders
archetypes only.

**Nothing in the product changed.** Read that before reading anything else in this section. The
catalog, the layers, the deck and the prompts are exactly as they were.

**RESOLVED 2026-07-30 — do not reverse, on merit rather than on cost.** An independent read of
all twelve scripts scored names funnier in pairs 1, 4 and 6 and traits funnier in pairs 2, 3 and
5: **3–3 by arm.** The scripts do not show the name arm winning, the question is priced at zero,
and the freeze holds. Before that verdict was read, the answer protocol was found to be
**inverted** — see correction #28 in §9, and read it before trusting any letter-based result
recorded earlier. Two findings came out of the packet that no instrument in this repo detects:
the **engine-vs-voice** criterion (which predicted funniness in all six pairs, and against which
the 251-entry trait deck audits **156 engines / 95 voices**), and a **live performance hazard**
in the name arm — pair 5 renders Scooby-Doo phonetically, four lines a player must perform aloud,
and every metric scores those lines as healthy. Both are written up in §4 of
`CHUNK4-REVERSAL-ANALYSIS.md`. **No deck rewrite — that is post-playtest work and the freeze
holds.**

**What was added, and how to delete it.** `CastStyle` in `server/services/prompts/comedyPrompts.ts`
is experiment scaffolding: a parameter that defaults to shipping behaviour and is not reachable
from any handler. `comedyPrompts.cast.test.ts` asserts the default is **byte-identical** to the
un-parameterised call for all three modes and both maturity ratings, and separately asserts the
`'name'` branch really differs — without that second assertion the A/B could have compared an arm
against itself. To remove: delete the type, the four `castStyle` parameters, the two branches,
`scripts/ab-generation.ts`, `scripts/ab-packet.ts` and the guard describe block. Nothing else
references it.

**The findings that are facts rather than opinions**, all measured over 6 paired generations plus
2 attack runs, $0.6957:

| | trait (shipping) | name (proposed) |
|---|---:|---:|
| words per line | 7.24 | **6.43** |
| invented speakers nobody could read | 0 | 1 |
| layer 3 hits per script | 0 | **~30** |
| **synopses that would ship redacted** | 0 of 6 | **4 of 6** |
| cost per round | $0.0514 | $0.0483 |

- **Production emits the SCREENED script** (`game.helpers.ts:151`, `game.handler.ts:306`), so
  under the proposed design the results screen would read *"someone you would recognise must
  fairly distribute two cakes among eight workers"* in four of six rounds. That is layer 3 working
  correctly on input it was not built for, not a bug in it.
- **Layer 3 becomes a popularity detector.** Famous casts: ~30 hits/script. A cast of eight
  obscure picks: **0**. The control fires hardest when the comedy is working.
- **The clustering failure is invisible to the telemetry.** Seven picks from one show produced
  `7/6/7/8/6/6/6/6` — the most even distribution in the whole experiment. The `Cast binding` line
  would score that round as the healthiest of the night.
- **Short names do not recover the +37.5%.** They recover **21%** of it. §14's cost increase was
  mostly the line budget (37.7 → 51.3 lines), not the labels — which corrects the implication in
  §14 that the label was the available lever.
- **Reversal is ~6 sessions**, and only ~25 of the 540 tests are a write-off. Settings and
  circumstances (258 of 509 catalog entries), `build-catalog.ts`, `scriptCast.service.ts` and 4a
  all survive untouched.

**The named casts are gitignored** (`.ab-casts.json`), and so is the packet. A committed array of
sixty franchise characters is 4a's artefact with a different job title. The committed script is a
harness containing no names.

### 17b. Cutover step 6 — four of five boxes PASS, with numbers

Run 2026-07-30 on the **running** unit (`MainPID` 1530165), not a `systemd-run` scratch unit.

| Box | Result |
|---|---|
| **1 — effective limits** | ✅ `MemoryMax=805306368` · `MemoryHigh=734003200` · `MemorySwapMax=0` · `CPUQuotaPerSecUSec=1s` · `TasksMax=256` · `User=plotslop`. Cgroup files agree exactly: `805306368` / `734003200` / `0` / `100000 100000`. `memory.events` all zero — the limits have never been hit in normal operation. |
| **2 — OOM fires and the process dies** | ⚠️ **NOT RUN.** Blocked by a tool-permission classifier on deliberate memory exhaustion, not by access. Script ready at `/root/.claude/jobs/…/box2.sh`. See below for what box 1 already covers. |
| **3 — CPU quota bites under multi-threaded load** | ✅ Four spinners moved into the service's own cgroup on a **2-core** host. Over a 10.028 s wall window the cgroup consumed **10,037,240 µs = 1.00 core**, not 2.00. `nr_throttled` 25 → 125, `throttled_usec` 705 ms → 6.43 s. Corroborated independently: both counters were already non-zero before the test, so the quota bites in normal operation too. |
| **4 — `ProtectHome` hides `/root`** | ✅ From inside the namespace, `/root` is an **empty directory, mode `d---------`**. From outside it has 22 entries. Invisible rather than merely unreadable, which is what covers `/root/Sanger` and the co-tenant secrets. |
| **5 — data directory inside the tree** | ✅ `cwd → /srv/plotslop`; `touch /srv/plotslop/nope` fails **`EROFS`**; `/srv/plotslop/data` is writable. |

**What box 2 was guarding against, and how much of it box 1 already settles.** Step 6 exists
because every previous measurement was on a transient unit — a typo, an override drop-in or a
delegated cgroup would look identical from outside. **Box 1 eliminates that entire class**: the
real cgroup files carry the real numbers. What box 2 uniquely covers is narrower and still open —
whether node *dies cleanly* rather than stalling under `MemoryHigh` reclaim, since a stall never
fires `Restart=` and the service would serve nobody without ever being "down".

### 17c. `trust proxy` — fixed, with the guard that matters

`server.ts` now sets `expressApp.set('trust proxy', 1)` before any middleware.

**`1`, not `true`, and the difference inverts the security property.** nginx sends
`X-Forwarded-For $proxy_add_x_forwarded_for`, which appends the real peer to whatever the client
sent. `true` trusts the whole chain and takes the **leftmost** entry, so a client sending
`X-Forwarded-For: 1.2.3.4` would choose its own rate-limit key — a limiter that is worse than none
because it looks like one.

`__tests__/unit/server/middleware/trustProxy.test.ts` proves this behaviourally over a real
socket with a forged header, including the non-vacuity case: with `true`, `req.ip` really does
come back as the forged `1.2.3.4`. Reading the config value back would have passed just as
happily on `true`.

**Correction to how this was first reported.** express-rate-limit logs that ValidationError
**once per process**, not once per request — its validation checks disable themselves after
firing. The journal for the whole 20:17→22:07 process life contains exactly one. The
shared-bucket *behaviour* applied to every request; the *symptom* was a single line, which is
why nothing surfaced it for as long as it did.

Scope unchanged from what was reported: the money paths are `SocketRateLimiter`, socket-keyed, and
were never affected. This repairs `gameMetadataLimiter` — 30/min on two read-only routes, until
now shared by everybody on the internet at once.
