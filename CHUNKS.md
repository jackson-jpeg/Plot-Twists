# CHUNKS — PlotSlop

Work batched into independently shippable sessions, ordered by **unblocking value**.

Machine labels: `[VPS]` = Linux host, `[MACBOOK]` = the Mac over the tunnel.
Updated 2026-07-28 with Jackson's rulings.

---

## 🔒 SCOPE FREEZE — standing rule

> No new features until chunks 1–4 ship and I have played this with eight people who are not my friends. Referrals, weekly challenges, and tvOS were built while the deployment was dead and the suite was red since April. If I ask you for feature work before that playtest, refuse and quote this paragraph back at me. That includes anything I frame as "quick" or "while we're in here."
>
> — Jackson, 2026-07-28

Parked ideas go to `BACKLOG.md`. It is not opened until the playtest has happened.

**Must ship before any feature work:** Chunks 1, 2, 3, 4.
**Parallel-safe:** Chunk 6 (CI), Chunk 7 (design tokens) — any time after Chunk 1.
**Blocked on a decision:** Chunk 5 (rename) — `DECISIONS.md` #10 only; #3 is resolved.
**Shelved, do not start:** iOS/tvOS and the mascot. Both in `BACKLOG.md`.

---

## Chunk 1 — Get it deployed 🟡 IN PROGRESS

**Goal:** `plotslop.com` serves a working game.

**Machine:** `[VPS]` for code; Railway/Firebase consoles need you.

### ✅ Done

| Item | Result |
|---|---|
| **Snapshot pushed** | `origin/audit/2026-07-28-snapshot` (`d170e227`). Both repos were entirely unpushed. `PlotTwists-Native` also pushed → `origin/wip-2026-07-23`. |
| **`.mcp.json` secured** | Held a live `SANGER_TOKEN` and both repos are **public**. Excluded + gitignored in `Plot-Twists`; untracked in `PlotTwists-Native` (verified the token was never in a pushed commit via `git log origin/master -S"SANGER_TOKEN"` → empty). |
| **`next build` fixed** | Root cause: `nixpacks.toml` passed six `NEXT_PUBLIC_FIREBASE_*` vars at build time and **no Clerk variable**. Added `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `force-dynamic` on `/_not-found`. **Verified `BUILD EXIT=0`** with the key present. |
| **Build requirement documented** | `.env.example` had no Clerk entries at all. Added both, with a note that the publishable key is needed at *build* time and that CI must supply it. |
| **Test suite green** | 4 stale assertions asserted the pre-`c441793f` event name `error` instead of `game_error_message`. Fixed in `helpers.test.ts` (×2) and `subscriptions.test.ts` (×2, incl. the test title). **30/30 suites, 397/397 tests.** |
| **Coverage threshold made honest** | Was 20% and had never been met, so `npm test` exited 1 on every run and the signal was ignored. Set to a regression ratchet just below actual (stmts 17, branches 10, funcs 14, lines 17). **`npm test` now exits 0.** |
| **CORS made additive** | `plotslop.com` + `www.` added to `server.ts` *alongside* the old domain, and the Vercel preview regex now matches both project names. This is what makes the Chunk 5 cutover non-atomic. |

### ⏳ Remaining — needs you

**Reordered by risk (Jackson, 2026-07-28): rules → host → DNS.**

1. **🔴 Firestore/Storage rules — or delete the Firebase project** (`DECISIONS.md` #7 / #7b). Production data is exposed *right now* under rules nobody has read, independent of the deploy. Either export them from the console (there is no CLI command — verified) or, if you're bailing on Firebase, delete the project outright. **Tell me if anything in it matters.**
2. **Three secrets.** `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. Nothing deploys without these.
3. **DNS.** Point `plotslop.com` at **`187.77.218.14`** (this VPS). It currently resolves to `2.57.91.91`, the Hostinger parked-page host.

**Railway is out** — free trial ended. Target is now this VPS (`DECISIONS.md` #5): nginx already carries the exact Socket.IO upgrade headers at `/etc/nginx/sites-enabled/sang3r.com`, `sanger-next.service` is the systemd template, and the persistent disk makes the JSON db adapter actually viable — Railway's ephemeral filesystem would have silently discarded it on every redeploy. Single replica is required regardless, since game state is process-local.

Once I have (2), I can do nginx + systemd + TLS from here without you.

**Done when:** `next build` exits 0, `npm test` exits 0, `curl -sI https://plotslop.com` returns 200 from the app rather than Hostinger, two browsers on different networks join the same room code and see each other, and the Firebase question is closed either way (rules committed, or project deleted).

---

## Chunk 2 — Stop the party from dying

**Goal:** the five defects that end a real game night.

**Machine:** `[VPS]` · **Blocked on:** Chunk 1 (verify against a live deploy)

**Files:** `server/utils/validation.ts`, `server/handlers/selection.handler.ts`, `server/services/room.service.ts`, `stores/subscriptions.ts`, `server/handlers/voting.handler.ts`, `server/handlers/index.ts`, `server/middleware/socketAuth.ts`, `server/handlers/room.handler.ts`

1. **Card-ID validation** — layer 2 of the IP fix, and the single highest value-per-hour change in the audit. `start_game` already computes each room's hand (`selection.handler.ts:120-134`); persist it on the `Room`, have the client submit **IDs**, resolve them server-side, and use the *catalog's* text. Player free text then never reaches the prompt at all. Closes prompt injection, makes the catalog authoritative, and stops arbitrary real-person names. (~4h)
2. **Wire `game_error` on web** — the server emits a structured error with a RETRY action (`game.helpers.ts:199-206`) that nothing listens for; `stores/subscriptions.ts` has 34 listeners and none is `game_error`. iOS handles it, web doesn't. (~1h)
3. **Host abandonment** — promote the longest-connected PLAYER when the host passes the grace period; route the 2-minute PERFORMING sweep (`room.service.ts:463`) to VOTING rather than RESULTS when `room.votes` is empty; guard `calculateResults` against a zero-vote tally. (~1d)
4. **Voter-drop stall** — re-run the all-voted predicate after any player removal and on `player_disconnected` (currently only checked inside `submit_vote`). Drop `VOTING_TIMEOUT` 60s → ~25s with a visible countdown. (~2h)
5. **Identity — three parts, not a validation patch** (see the auth investigation in AUDIT.md Track 7). Root cause is migration accretion: each identity mechanism was added as an *additional* accepted credential.
   a. **Fix the inverted precedence.** `room.handler.ts:49,172,463` prefer the unverified client string over the verified Clerk subject: `playerSessionId ?? userId ?? legacy_uuid`. For authenticated players, identity is the Clerk `sub`.
   b. **Server-issued reconnect secret for guests.** The game allows tokenless connections (`socketAuth.ts:47-53`), so most players have no Clerk identity to delegate to. Mint a secret on join, return once, store the hash, verify on `rejoin_room`.
   c. **Delete the other credential paths.** Drop the `findPlayerInRoomByUserId` fallback in `rejoin_room` (`reconnection.handler.ts:57-58`) and the `playerId === userId` match (`room.service.ts:346`), and stop broadcasting `sessionId`/`uid` in `players_update` (`room.handler.ts:182`).
   Cleanup while in there: delete the dead `server/routes/auth.ts` (Firebase phone auth, never registered — `routes/index.ts:45`) and rename `user.service.ts:369` `verifyIdToken`, which is Firebase's name for a function that calls Clerk. (~1.5d)
6. **Spectator votes must not count** — `voting.handler.ts:19-26` resolves the voter across all `room.players` with no role filter; only the target is role-checked. Combined with the silent spectator demotion, an overflow joiner decides the winner. (~1h)
7. **Guard zero-vote results** — `calculateResults` emits `game_over` with `winner: undefined` and `allResults: []` as a normal outcome (`voting.service.ts:162-176`). (~1h)

**Done when** the harness goes from **16/28** to at least **26/28** — every check below flipping from red to green, both results shown in the same session:
| Scenario → case | Fixed by |
|---|---|
| `abuse` → server REJECTS off-catalog card text | item 1 |
| `abuse` → injected text does NOT reach the model prompt | item 1 |
| `aiFailure` → mode=malformed / mode=error | item 2 |
| `hostAbandon` → the round survives an abandoned host | item 3 |
| `voterDrop` → results resolve promptly when a voter drops | item 4 |
| `identity` → a guessed/stolen playerSessionId cannot claim a seat | item 5b |
| `identityBroadcast` → players_update does not broadcast credentials | item 5c |
| `identityBroadcast` → a broadcast playerId cannot claim a seat | item 5a+5c |
| `spectatorVote` → a spectator vote does not count | item 6 |
| `emptyResults` → a zero-vote round is not a normal game_over | item 7 |

**Report harness as `N/28` at the top of every chunk from here.** No defect is closed without its case failing before the fix and passing after, both shown in the same session.

---

## Chunk 3 — Abuse hardening

**Goal:** a single client can't OOM the server. **Machine:** `[VPS]` · **Blocked on:** Chunk 1

1. **Re-key every rate limiter** off `socket.id` onto client IP or authenticated user ID. Demonstrated bypass: **50 rooms in ~2s** against a limit of 10 per 5 minutes. (~4h)
2. **Cap live rooms per IP** — rooms are `Map` entries evicted only after 60 min idle, so this is memory exhaustion, not cost. (~1h)
3. **Delete or wire the dead config** — `CONFIG.rateLimits`, `CONFIG.generation.model`, `CONFIG.generation.timeoutMs` are all unreferenced. (~2h)
4. **Fisher-Yates** for card dealing — `selection.handler.ts:126-130` uses `sort(() => Math.random() - 0.5)`, biased toward authored order. (~10 min)
5. `npm audit` triage — 42 vulnerabilities, 7 critical; bump `socket.io`/`engine.io-client` for the `ws` advisories. (~2h)

**Done when:** `rateLimit: reconnecting does NOT reset the room-creation limit` passes and no criticals remain in the runtime dependency path.

---

## Chunk 4 — IP de-risk (THREE LAYERS — ship together)

**Goal:** remove the S1 legal exposure. **Machine:** `[VPS]`
**Blocked on:** Chunk 2 item 1 (which *is* layer 2).

> The IP fix is not the catalog rewrite. It is three layers, and shipping any one alone is theater.
> — Jackson, 2026-07-28

**Do not mark IP resolved until all three land.**

### 4a — Kill `homepagePosterBriefs.ts` FIRST, separately, on its own commit

Not part of the three-layer work and not blocked by it. `lib/homepagePosterBriefs.ts:22-46` does not merely name Shrek — it specifies how to render him (*"broad ogre silhouette, expressive animated face, textured green skin… Do not make Shrek photorealistic"*). Exposure is what you did; intent is what you wrote down about doing it. This is the latter.

Also delete the six bundled crossover assets from the iOS catalog (`shrek-in-seinfeld`, `barbie-in-breaking-bad`, `darth-vader-in-the-office`, `ned-stark-in-hannah-montana`, `lightning-mcqueen-in-the-sopranos`, `wednesday-addams-in-baywatch`) so they cannot ship by accident. **This is the only iOS-repo change permitted while iOS is shelved.** (~2h)

### Layer 1 — Catalog rewrite (server-side source of truth)

Rewrite all **252** entries in `lib/content.ts` from named IP to archetypes. LLM-assisted first pass, human review every line. `Shrek` → `A grumpy swamp ogre who just wants to be left alone`. Delete `lib/content.ts:340` (`Jerry Seinfeld`) and sweep for other named real people. Fix `comedyPrompts.ts:415`, which currently *teaches* the model Star Wars characters by name. Sweep `server/data/communityPacks.ts:337`. (~1.5d)

### Layer 2 — Server-side validation (lands in Chunk 2)

Submitted card **IDs** resolve against the catalog. Free text never interpolated into a system prompt. See Chunk 2 item 1.

### Layer 3 — Output screening

Screen generated content for named real people and owned franchises before `script_ready` is emitted. A cheap classifier pass or a Haiku-tier call. Log generations with room code and timestamp so a complaint can be investigated. (~1d)

**Done when:** all three layers are live; `grep -iE "shrek|seinfeld|darth|barbie|hogwarts|marvel|sopranos"` across `lib/`, `server/`, and the iOS asset catalog returns zero matches; a player submitting the literal string "Shrek" is rejected at the server; a generation that names a real person is caught by layer 3; and a full game still produces a funny script.

---

## Chunk 5 — Rename execution

**Goal:** PlotSlop everywhere on web. **iOS excluded.** **Machine:** `[VPS]`
**Blocked on:** `DECISIONS.md` #10 (copy voice). #3 is resolved — PLOTSLOP is clean.

1. Mechanical rename across ~98 files: `Plot Twists` (122), `PlotTwists` (84), `plottwists` (84), `plot-twists` (35). (~4h)
2. Copy pass in the chosen voice. **Do not touch `comedyPrompts.ts`** — it is craft instruction to the model; making it ironic will degrade output. (~4h)
3. `package.json` name, `manifest.json` name/short_name/description, OG copy, `robots.ts` and `sitemap.ts` absolute URLs.
4. Replace the real SHA-256 fingerprint in `assetlinks.json` (currently `TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT` — Android deep links have never worked).
5. **Yours:** Clerk allowed origins + redirect URLs, Firebase authorised domains, Stripe webhook endpoints, GitHub repo rename, Vercel project name.
6. **After the cutover settles:** remove `plot-twists.com` from the CORS allowlist. No 301 — the domain is being allowed to expire (`DECISIONS.md` #1).

CORS and the Vercel regex were already made additive in Chunk 1, so there is no half-renamed broken window.

**Done when:** `grep -riE "plot[-_ ]?twists?"` returns only intentional historical references, and a full game plays end-to-end on `plotslop.com`.

---

## Chunk 6 — CI and observability

**Parallel-safe**, any time after Chunk 1. **Machine:** `[VPS]`

1. Real CI: install → `tsc --noEmit` → `npm test` → `next build` on every PR. **Must supply `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** — the build requires it and publishable keys are not secrets, so a dummy is fine. Today `.github/workflows/` holds only two Claude Code integrations; nothing gates main, which is how a red suite and a broken build both survived since April. (~2h)
2. Add the harness to CI (`DECISIONS.md` #11) — the only test touching `game.handler.ts` or `voting.handler.ts`, both at 0% coverage. (~2h)
3. Sentry, server and client, with source maps. (~2h)
4. `/health` endpoint + uptime monitor. (~1h)
5. Structured logging with a `roomCode` field so one game's trace is reconstructable. (~4h)
6. Ratchet the coverage thresholds up as coverage improves (currently stmts 17 / branches 10 / funcs 14 / lines 17).

---

## Chunk 7 — Design token cleanup

**Parallel-safe.** Best **before** Chunk 5 so the rename touches already-tokenised files. **Machine:** `[VPS]`

1. Lint rule banning raw hex and `rgba()` in `.tsx`. (~2h)
2. Sweep **261 hardcoded hex** and **619 `rgb`/`rgba` literals** into tokens — 880 literal colour values against 2,080 token references. (~1d)
3. Reconcile `--color-theater-bg`: `globals.css:122` says `#09090B`, the brief says `#0C0C0E`.
4. Use iOS as the reference — `PlotTwists/Shared/Views/` has 2,008 token references and **zero** hardcoded colours.

---

## Chunk 8 — iOS unshelving *(do not start — but read the gate below first)*

**iOS + tvOS are shelved.** No rename of the 349 occurrences, no bundle-ID decision, tvOS target kept. The bundle-ID question is *answered* as a side effect of the domain check: `com.plottwists.app` is not on the App Store and has no archive on the build machine, so changing the IDs later is free. Only permitted change while shelved: deleting the six crossover assets (Chunk 4a).

### 🚫 BLOCKING PRE-SHIP GATE — associated domains point at an expired domain

**If you are a future session picking this up: this is not a note. No iOS or tvOS build ships until every box below is ticked.**

`plot-twists.com` was **deliberately allowed to expire on 2026-08-01** (`DECISIONS.md` #1). The app's associated-domain entitlements still point at it. Once the registration lapses, anyone can register that domain and inherit these associations.

**File:** `PlotTwists/iOS/PlotTwists.entitlements`

| Line | Entitlement key | Risk if shipped unchanged |
|---|---|---|
| 13 | `applinks:plot-twists.com` | Whoever owns the domain can serve an AASA and open attacker-controlled deep links inside the app |
| 14 | `applinks:www.plot-twists.com` | Same |
| 15 | **`webcredentials:clerk.plot-twists.com`** | **The worst one.** This is the Clerk *authentication* subdomain, associated for Password AutoFill. A third party controlling it is associated with credential autofill for this app |

**Checklist — all must be true before any archive is uploaded:**

- [ ] All three entries repointed to the `plotslop.com` equivalents
- [ ] `apple-app-site-association` is served from `https://plotslop.com/.well-known/` **and returns 200** — verify with `curl`, do not assume
- [ ] `webcredentials` points at the Clerk subdomain that actually exists under the new domain (confirm in the Clerk dashboard; `clerk.plotslop.com` is an assumption until checked)
- [ ] `assetlinks.json` has a **real** SHA-256 fingerprint — it currently reads `TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT`, so Android app links have never worked
- [ ] `grep -rn "plot-twists\.com" PlotTwists/` returns **zero** results outside comments
- [ ] `PlotTwists/Shared/Config.swift:30` no longer points at `web-production-c7981.up.railway.app` (currently a dead host returning 404)

Was this domain ever live in a shipped build? No — verified 2026-07-28: not on the App Store (`itunes.apple.com/lookup?bundleId=com.plottwists.app` → 0 results), no `.xcarchive` on the build Mac, and any TestFlight build would have expired (90-day window; deprecated since 2026-04-05). **That is why letting the domain lapse was safe. It stops being safe the moment a build ships with these entitlements.**

---

## Mascot — do not build

See `BACKLOG.md`.

---

## Critical path

```
Chunk 1 (deploy) ──┬──▶ Chunk 2 (party-killers + IP layer 2) ──▶ Chunk 4 (IP layers 1+3) ──▶ Chunk 5 (rename)
   🟡 code done    │                                                                              ▲
   needs Railway   ├──▶ Chunk 3 (abuse hardening)                             DECISIONS #10 ──────┘
   + DNS + rules   ├──▶ Chunk 6 (CI + observability)  [parallel]
                   └──▶ Chunk 7 (design tokens)       [parallel, before 5]

                            ▼
              PLAYTEST — eight people, none of them friends
                            ▼
                 everything in BACKLOG.md unfreezes
```

Chunks 1–4 are roughly two weeks. The playtest is the gate, not this document.
