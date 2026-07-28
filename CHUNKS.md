# CHUNKS — PlotSlop

Work batched into independently shippable sessions, ordered by **unblocking value** — what makes the next chunk possible — not by severity.

Machine labels: `[VPS]` = this Linux host, `[MACBOOK]` = the Mac over the tunnel.

---

## The split

**Must happen before any further feature work:**
Chunks 1, 2, 3, 4. Nothing new gets built until the app deploys, the loop survives a real party, and the S1 legal exposure is gone.

**Can happen in parallel** (independent files, no shared blockers):
Chunk 6 (CI) and Chunk 7 (design tokens) can run alongside 2–4 by anyone, any time after Chunk 1.
Chunk 5 (rename) is blocked only on `DECISIONS.md` #3.

**Explicitly deferred — do not start:**
Chunk 8 (iOS). Chunk 9 (mascot). Anything touching card packs, referrals, weekly challenges, leaderboards, or progression.

---

## Chunk 1 — Get it deployed

**Hand this straight back to me. It needs nothing from you first.**

**Goal:** `plotslop.com` serves a working game.

**Machine:** `[VPS]` for the code; you or I hit Railway/Firebase consoles for the rest.

**Blocked on:** nothing to start. `DECISIONS.md` #5 (deploy target) and #6 (Railway state) shape the second half; I will default to Railway and adapt.

**Files touched:** `nixpacks.toml`, `app/not-found.tsx`, `server.ts`, new `firestore.rules`

**Work:**
1. Fix `next build`. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the `[variables]` block in `nixpacks.toml`, or set `export const dynamic = 'force-dynamic'` in `app/not-found.tsx`. (~30 min — this is likely why Railway is down.)
2. Fix the 4 stale tests in `__tests__/unit/server/socket/helpers.test.ts` and `__tests__/unit/stores/subscriptions.test.ts` — they assert the pre-`c441793f` event name `error` instead of `game_error_message`. (~30 min)
3. Commit the repaired git index. The working tree is currently 2 modified + untracked `scripts/harness/`; get it onto a real branch and pushed. The repo spent this audit one `git clean -fd` away from losing everything.
4. Add `plotslop.com` and `www.plotslop.com` to the CORS allowlist in `server.ts:32-34`, **alongside** the existing entries. Additive — this is what makes the later cutover non-atomic.
5. Redeploy. Point `plotslop.com` DNS at it. Pin to **one replica** (all state is process-local — see AUDIT Track 2).
6. **Before going live:** export the deployed Firestore security rules, read them, commit them as `firestore.rules`, and wire them into the deploy (`DECISIONS.md` #7). If they are the 30-day open default, lock them first.

**Done when:**
- `npx next build` exits 0 on a clean checkout
- `npm test` exits 0
- `curl -sI https://plotslop.com` returns 200 from the app, not Hostinger
- Two browsers on different networks can join the same room code and see each other
- `firestore.rules` is in the repo and deployed

---

## Chunk 2 — Stop the party from dying

**Goal:** the five defects that end a real game night.

**Machine:** `[VPS]`

**Blocked on:** Chunk 1 (you want to verify these against a live deploy).

**Files touched:** `server/utils/validation.ts`, `server/handlers/selection.handler.ts`, `server/services/room.service.ts`, `stores/subscriptions.ts`, `server/handlers/voting.handler.ts`, `server/handlers/index.ts`, `server/middleware/socketAuth.ts`, `server/handlers/room.handler.ts`

**Work:**
1. **Card validation against the dealt hand** (AUDIT Track 3, S1). `start_game` already computes each room's hand at `selection.handler.ts:120-134` — persist it on the `Room`, then reject any `submit_cards` value not in it. Closes prompt injection, makes the content library actually authoritative, and stops arbitrary real-person names in one change. **Highest value-per-hour fix in the report.** (~4h)
2. **Wire `game_error` on web** (Track 1, S2). Add the missing subscription in `stores/subscriptions.ts` — the server sends a retry action nobody listens for. Surface the message and render `action.type === 'RETRY'` as a button emitting `retry_script_generation`. (~1h)
3. **Host abandonment** (Track 2, S2). Promote the longest-connected PLAYER to host when the host passes the grace period; change the 2-minute PERFORMING sweep at `room.service.ts:463` to route to VOTING rather than RESULTS when `room.votes` is empty. Guard `calculateResults` against a zero-vote tally. (~1d)
4. **Voter-drop stall** (Track 2, S2). Re-run the all-voted predicate after any player removal and on `player_disconnected` — currently it is only checked inside `submit_vote`. Drop `VOTING_TIMEOUT` from 60s to ~25s and add a visible countdown. (~2h)
5. **Server-issued reconnect tokens** (Track 7, S1). Stop trusting the client-supplied `playerSessionId`. Mint a random secret on join, return it once in the ack, store the hash on the player, verify on `rejoin_room`. (~1d)

**Done when:** these harness checks flip to PASS —
`abuse: server REJECTS off-catalog / injected card text`
`abuse: injected text does NOT reach the model prompt`
`voterDrop: results resolve promptly when a voter drops`
`identity: a guessed/stolen playerSessionId cannot claim a seat`
`aiFailure: mode=malformed / mode=error: players are told generation failed`
— and a manual host-kill during PERFORMING reaches a real VOTING phase.

---

## Chunk 3 — Abuse hardening

**Goal:** a single client can't OOM the server.

**Machine:** `[VPS]`

**Blocked on:** Chunk 1.

**Files touched:** `server/middleware/rateLimiter.ts`, `server/handlers/room.handler.ts`, `server/handlers/game.helpers.ts`, `server/handlers/audience.handler.ts`, `server/handlers/cardpack.handler.ts`, `server/handlers/user.handler.ts`, `server/utils/config.ts`

**Work:**
1. **Re-key every rate limiter** off `socket.id` and onto client IP (`socket.handshake.address`) or authenticated user ID (Track 7, S2). Demonstrated bypass: 50 rooms in ~2s against a limit of 10 per 5 minutes. (~4h)
2. **Cap total live rooms per IP** — rooms are `Map` entries evicted only after 60 min idle, so the bypass is a memory-exhaustion path, not a cost path. (~1h)
3. **Delete or wire up the dead config.** `CONFIG.rateLimits`, `CONFIG.generation.model`, and `CONFIG.generation.timeoutMs` are all unreferenced (Track 3, S3). A config file that looks like the control surface and isn't will burn whoever tunes this next. (~2h)
4. **Fisher-Yates** for card dealing — `selection.handler.ts:126-130` uses `sort(() => Math.random() - 0.5)`, which is biased toward authored order and makes the game feel repetitive by round 3. (~10 min)
5. `npm audit` triage — 42 vulnerabilities, 7 critical. Bump `socket.io`/`engine.io-client` for the `ws` advisories. (~2h)

**Done when:** `rateLimit: reconnecting does NOT reset the room-creation limit` passes, and `npm audit` shows no criticals in the runtime dependency path.

---

## Chunk 4 — Content de-risk

**Goal:** remove the S1 legal exposure.

**Machine:** `[VPS]`

**Blocked on:** `DECISIONS.md` #4 (strategy). **Must come after Chunk 2 item 1** — sanitising the library is worthless while `validateCardSelection` accepts any string.

**Files touched:** `lib/content.ts`, `lib/homepagePosterBriefs.ts`, `server/services/prompts/comedyPrompts.ts`, `server/data/communityPacks.ts`, `PlotTwists/Shared/Resources/Assets.xcassets/*`

**Work (assuming Option A — archetypes):**
1. Rewrite all **252** entries in `lib/content.ts` from named IP to archetypes. LLM-assisted first pass, human review every line. `Shrek` → `A grumpy swamp ogre who just wants to be left alone`. (~1.5d)
2. Delete `lib/content.ts:340` (`Jerry Seinfeld`) and sweep for any other named real person.
3. Rewrite `lib/homepagePosterBriefs.ts` — these are the worst artefact in the repo, because they are written instructions to reproduce specific protected character designs ("Shrek must remain fully animated… broad ogre silhouette, expressive animated face, textured green skin"). (~2h)
4. Fix `comedyPrompts.ts:415` — the system prompt currently *teaches* the model about Star Wars characters by name.
5. Sweep `server/data/communityPacks.ts` (contains a Shrek reference at line 337).
6. Regenerate the 6 bundled iOS crossover posters. **Deferred with Chunk 8** — but delete them from the asset catalog now so they cannot ship by accident.

**Done when:** `grep -iE "shrek|seinfeld|darth|barbie|hogwarts|marvel|sopranos"` across `lib/`, `server/`, and the iOS asset catalog returns zero matches, and a full game still generates a funny script.

---

## Chunk 5 — Rename execution

**Goal:** PlotSlop everywhere on web. **iOS excluded — see Chunk 8.**

**Machine:** `[VPS]`

**Blocked on:** `DECISIONS.md` #3 (USPTO clearance — do not start until this is clean) and #10 (copy voice).

**Files touched:** ~98 web files. Load-bearing ones: `package.json`, `public/manifest.json`, `public/.well-known/apple-app-site-association`, `public/.well-known/assetlinks.json`, `server.ts`, `app/robots.ts`, `app/sitemap.ts`, all `opengraph-image.tsx`.

**Work — in this order:**
1. Mechanical rename of copy, component names, comments, and fixtures. All variants: `Plot Twists` (122), `PlotTwists` (84), `plottwists` (84), `plot-twists` (35). (~4h)
2. Copy pass in the chosen voice (`DECISIONS.md` #10). **Do not touch `comedyPrompts.ts`** — it is craft instruction to the model and making it ironic will degrade output. (~4h)
3. `package.json` name, `manifest.json` `name`/`short_name`/`description`, OG image copy, `robots.ts` and `sitemap.ts` absolute URLs.
4. Fix the Vercel preview regex at `server.ts:44` — currently `/^https:\/\/plot-twists(-[a-z0-9-]+)*\.vercel\.app$/`, which fails silently on a renamed project.
5. Replace the real SHA-256 fingerprint in `assetlinks.json` (currently `TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT` — Android deep links have never worked).
6. **External systems (yours):** Clerk allowed origins + redirect URLs, Firebase authorised domains, Stripe webhook endpoints, GitHub repo rename, Vercel project name.
7. **After the cutover settles:** remove `plot-twists.com` from the CORS allowlist and add the 301 (only if `DECISIONS.md` #1 went the restore way).

**Sequencing note:** the only atomic requirement is DNS + the deploy carrying the new AASA/assetlinks. Because Chunk 1 already made CORS additive, there is no half-renamed broken window.

**Done when:** `grep -riE "plot[-_ ]?twists?"` across the web repo returns only intentional historical references (CHANGELOG, this audit), and a full game plays end-to-end on `plotslop.com`.

---

## Chunk 6 — CI and observability

**Parallel-safe.** Any time after Chunk 1.

**Goal:** you find out when it breaks, not your friends.

**Machine:** `[VPS]`

**Blocked on:** nothing (needs Chunk 1's test fixes to land green).

**Files touched:** `.github/workflows/ci.yml` (new), `lib/logger.ts`, `server/routes/index.ts`, `package.json`

**Work:**
1. A real CI workflow: install → `tsc --noEmit` → `npm test` → `next build` on every PR. Today `.github/workflows/` contains only two Claude Code integrations — **nothing gates main**, which is how a red suite and a broken build both survived since April. (~2h)
2. Add the harness to CI (`DECISIONS.md` #11). It is the only test touching `game.handler.ts` or `voting.handler.ts`, both at **0% coverage**. (~2h)
3. Sentry, server and client, with source maps. (~2h)
4. `/health` endpoint + an uptime monitor pointed at it. (~1h)
5. Structured logging with a `roomCode` field so one game's trace is reconstructable. (~4h)
6. Raise the jest coverage threshold once it is honestly above 20% — it is currently 17.51% against a configured 20%, which is why `npm test` exits 1.

**Done when:** a PR that breaks the build fails CI, and a thrown server error appears in Sentry within a minute.

---

## Chunk 7 — Design token cleanup

**Parallel-safe.** Best done **before** Chunk 5, so the rename touches already-tokenised files.

**Goal:** one place to change the palette.

**Machine:** `[VPS]`

**Blocked on:** nothing.

**Files touched:** `app/globals.css`, ~43 files under `app/` and `components/`, `.eslintrc` or `stylelint` config

**Work:**
1. A lint rule banning raw hex and `rgba()` literals in `.tsx`. (~2h)
2. Sweep the **261 hardcoded hex** and **619 `rgb`/`rgba` literals** into tokens — 880 literal colour values against 2,080 token references. (~1d)
3. Reconcile `--color-theater-bg`: `app/globals.css:122` says `#09090B`, the brief says `#0C0C0E`. Pick one and fix the other.
4. Use iOS as the reference implementation — `PlotTwists/Shared/Views/` has **2,008 token references and zero hardcoded colours**. It is the best-disciplined code in either repo.

**Done when:** the lint rule passes clean and changing `--color-accent` in one file visibly changes the whole app.

---

## Chunk 8 — iOS *(deferred — do not start)*

Listed so it is explicitly out of scope, not forgotten.

The app cannot build (`missing Metal Toolchain`; Mac data volume at 100%, ~1.2 GiB free), points at a dead Railway URL hardcoded at `Config.swift:30`, and is already `status: deprecated` in your own `ios-toolkit/config/projects.yml` as of 2026-04-05.

**Do not** rename its 349 occurrences. **Do not** migrate its bundle IDs — that is a one-way door (`DECISIONS.md` #2) for an app you are not shipping. Leave it on `master`.

The one thing worth doing now, inside Chunk 4: **delete the 6 bundled crossover poster assets** so they cannot ship by accident.

Revisit only after the web app has been played by strangers. If it has, the tvOS target (`com.plottwists.tv`) is a genuine differentiator — TV as the shared screen, phones as controllers, which is the Jackbox shape the web version structurally cannot be.

---

## Chunk 9 — Mascot *(deferred — do not start)*

Reely does not exist (zero matches in both codebases). Nothing to re-skin, nothing to migrate, nothing blocked. `DECISIONS.md` #8 recommends shipping without one. Revisit after Chunk 1 tells you whether anyone plays this.

---

## Critical path

```
Chunk 1 (deploy)  ──┬──▶ Chunk 2 (party-killers) ──▶ Chunk 4 (content) ──▶ Chunk 5 (rename)
                    │                                                            ▲
                    ├──▶ Chunk 3 (abuse hardening)                               │
                    │                                              DECISIONS #3 ─┘
                    ├──▶ Chunk 6 (CI + observability)   [parallel]
                    └──▶ Chunk 7 (design tokens)        [parallel, do before 5]
```

Chunks 1–4 are roughly **two weeks of focused work**. At the end of them you have a deployed game, without the defects that end a party, without the legal exposure.

**Then do the thing that is not in this document: play it with eight people who are not your friends, and watch where they look at their phones.** Everything after that should be decided by what you see, not by this audit.
