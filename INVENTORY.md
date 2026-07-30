# INVENTORY — PlotSlop (Phase 0)

Facts only. Gathered 2026-07-28. No findings, no opinions.
Machine labels: `[VPS]` = Linux audit host, `[MACBOOK]` = Jackson's Mac over the tunnel.

---

## 1. Repositories

| Repo | Path | Remote | Branch | HEAD | Last commit |
|---|---|---|---|---|---|
| Web + game server | `/root/Plot-Twists` | `github.com/jackson-jpeg/Plot-Twists` | `v2` (default) | `f99ab31d` | **2026-04-23** |
| iOS/tvOS app | `/root/PlotTwists-Native` | `github.com/jackson-jpeg/PlotTwists-Native` | `wip-2026-07-23` | `d016f526` | 2026-07-24 |

`[VPS] git log --since=2026-04-01 --oneline | wc -l` → **3** commits in the web repo since April 1.

Web repo remote branches (14): `v2` (HEAD), `add-claude-github-actions-1770006442031`, `claude/app-review-documentation-qYqGR`, `claude/claude-md-mkxf4wqd6frdvc7o-kYOMG`, `claude/fix-build-issues-4cPb6`, `claude/redesign-voting-ui-H4pCz`, `claude/review-architecture-features-9Zlxf`, `claude/review-project-codebase-gtHY8`, `claude/review-railway-errors-mCwZ3`, `claude/update-claude-md-CZckS`, `claude/update-claude-md-eWt6Q`, `sanger/1771819998166-step`, `sanger/1771820061669-step`.

iOS repo remote branches (3): `master` (HEAD), `wip-2026-07-23`, `fix/clerk-logger-use-log-service`.

### Repo state at audit start

`[VPS] cd /root/Plot-Twists && git status --short | awk '{print $1}' | sort | uniq -c`
```
     35 ??
    403 D
```
All 403 tracked files were staged-deleted while simultaneously present on disk and untracked. `git reflog -8` contained exactly one entry (`clone: from https://github.com/jackson-jpeg/Plot-Twists.git`), and `git stash list` was empty. Repaired during this audit with `git reset` (non-destructive, index restored from HEAD). Post-repair state: 2 modified (`package.json`, `package-lock.json`), 1 untracked (`.mcp.json`).

`package.json` local drift vs HEAD:
```diff
-    "typescript": "^5.9.3"
+    "typescript": "5.9.3"
```
(plus a corresponding 855-line `package-lock.json` reduction)

---

## 2. Deploy targets

| Target | Config | State |
|---|---|---|
| Railway | `railway.json` (NIXPACKS, `npm run start`, restart ON_FAILURE max 10) | `https://web-production-c7981.up.railway.app` → **HTTP 404** `{"status":"error","code":404,"message":"Application not found"}` |
| Vercel | `vercel.json` (`next build`, framework nextjs) | Not verified — no credentials |
| `plot-twists.com` | Hardcoded in `server.ts:32-33` CORS allowlist; `PlotTwists/iOS/PlotTwists.entitlements:13-14` | **No DNS A record.** `getent hosts plot-twists.com` → empty; `curl` → "Could not resolve host" |
| `plotslop.com` | — | Resolves to `2.57.91.91`. HTTP 200, `server: hcdn`, serves **Hostinger parked-domain page** (`<title>Parked Domain name on Hostinger DNS system</title>`) |

`[VPS] curl -sSI https://web-production-c7981.up.railway.app/socket.io/?EIO=4&transport=polling` → **404**.

### ⚠️ CORRECTION 2026-07-30 — this table was incomplete, and so was the rename that used it

It lists **one** brand domain. The code contained **four**, and the three missing ones were found
only by grepping for what the code *prints* rather than for the name being renamed away. Recorded
here because the rename inventory in §13 was driven off this table, so its gap became the rename's
gap. Corrected in Chunk 5 (`HANDOFF.md` §12, §9 #15).

| Domain | Then | Now |
|---|---|---|
| `plot-twists.com` | as above, no DNS | removed from CORS and all live code |
| **`plottwists.com`** | **never recorded** — resolved to **`156.254.10.135`, a third party's server**, and was printed as the join instruction on the host lobby (`HostLobby.tsx:253,310`) | resolved through `lib/siteUrl.ts` |
| `plottwists.app` | never recorded — no DNS. Was the SEO canonical in `robots.ts`/`sitemap.ts`, the replay OG base, and the share-URL base in `user.handler.ts` | same |
| `plottwists.live` | never recorded — no DNS. Watermarked into generated share images | same |

Also missing from the domain table, and noted at the time as the specific gap that let the auth
entitlement survive: **a row for `webcredentials:` domains.** The "Universal links" row in §13
cites `entitlements:13-14` and stops at `applinks:`.

Not present in this VPS's nginx (`/etc/nginx/sites-enabled/`: chirpchirps, docket4.me, dork, highdesert, leftsaid, openclaw, sang3r.com, screenreceipts, sogojet.com, vps-api).

---

## 3. Codebase size

### Web (`/root/Plot-Twists`)
- 243 `.ts`/`.tsx` files across `server/ app/ lib/ stores/ components/ contexts/ hooks/`
- `server/` = 8,587 lines across 61 files
- 62 distinct `socket.on(...)` handlers registered
- `lib/content.ts` = 1,067 lines
- `server/services/prompts/comedyPrompts.ts` = 466 lines / 23,772 bytes

Largest server modules:
| Lines | File |
|---|---|
| 717 | `server/services/audience.service.ts` |
| 551 | `server/services/room.service.ts` |
| 547 | `server/handlers/room.handler.ts` |
| 509 | `server/handlers/game.handler.ts` |
| 498 | `server/services/playerStats.service.ts` |
| 474 | `server/services/progression.service.ts` |

### iOS (`/root/PlotTwists-Native`)
- 96 `.swift` files, 30,953 lines
- Targets: `com.plottwists.app` (iOS), `com.plottwists.app.widgets`, `com.plottwists.tv` (tvOS), `com.plottwists.tests`
- Team ID `2MU4PC84GZ`, deployment target 18.0, build system XcodeGen
- Registry entry `/root/ios-toolkit/config/projects.yml`: `status: deprecated  # portfolio audit 2026-04-05`

---

## 4. Dependencies

Node `22.23.1` on the audit host; `package.json` declares `"node": "22.x"`, `.node-version` says `20.9.0`.

`[VPS] npm audit` → **42 vulnerabilities (3 low, 14 moderate, 18 high, 7 critical)**. Includes `ws` (via `engine.io-client`, `socket.io-adapter 2.5.2–2.5.6`) and `@babel/core` (arbitrary file read via sourceMappingURL).

`[VPS] npm outdated` — major-version gaps on direct dependencies:

| Package | Current | Latest |
|---|---|---|
| `@anthropic-ai/sdk` | 0.72.1 | **0.115.0** |
| `@clerk/nextjs` | 6.38.2 | 7.6.2 |
| `@clerk/backend` | 2.32.1 | 3.13.2 |
| `@google/genai` | 1.39.0 | 2.13.0 |
| `firebase-admin` | 13.6.0 | 14.2.0 |
| `@stripe/stripe-js` | 8.7.0 | 9.12.1 |
| `@stripe/react-stripe-js` | 5.6.0 | 6.8.0 |
| `@apple/app-store-server-library` | 2.0.0 | 3.1.0 |
| `jest` | 29.7.0 | 30.4.2 |
| `next` | 16.1.6 | 16.2.12 |

---

## 5. Build health

### Web `[VPS]`

| Step | Result |
|---|---|
| `npm install` | exit 0 |
| `npx tsc --noEmit` | **exit 0, zero output** |
| `npx next build` | **exit 1 — FAILS** |
| `npm test` (`jest --coverage`) | **exit 1** |

`next build` failure (compiles, then fails at prerender):
```
✓ Compiled successfully in 20.9s
  Running TypeScript ...
  Collecting page data using 1 worker ...
⚠ Using edge runtime on a page currently disables static generation for that page
Error occurred prerendering page "/_not-found".
Error: @clerk/clerk-react: Missing publishableKey.
Export encountered an error on /_not-found/page: /_not-found, exiting the build.
⨯ Next.js build worker exited with code: 1
```
Also emitted: workspace-root warning from duplicate lockfiles (`/root/package-lock.json` selected over `/root/Plot-Twists/package-lock.json`).

Artifacts produced before the failure: `.next` = 27 MB, `.next/static/chunks` = 2.4 MB.

### Tests `[VPS]`
```
Test Suites: 2 failed, 28 passed, 30 total
Tests:       4 failed, 393 passed, 397 total
Time:        39.174 s
```
Failing suites: `__tests__/unit/server/socket/helpers.test.ts`, `__tests__/unit/stores/subscriptions.test.ts`.

Failure text (representative):
```
● validateRoom › should return null and emit error for invalid room code
  Expected: "error", "Invalid room code"
  Received: "game_error_message", "Invalid room code"
```
(The event was renamed in commit `c441793f`; the tests were not updated.)

Coverage — configured threshold is 20% (`jest.config.js`), actual:
```
File                             | % Stmts | % Branch | % Funcs | % Lines
All files                        |   17.51 |    10.83 |   14.73 |   17.69
 server/handlers                 |    4.49 |     8.02 |   11.11 |    4.57
  game.handler.ts                |       0 |        0 |       0 |       0
  voting.handler.ts              |       0 |        0 |       0 |       0
 server/services                 |   41.68 |     30.5 |   42.38 |   42.16
  room.service.ts                |   68.61 |    44.73 |   78.04 |   72.75
  scriptGeneration.service.ts    |       0 |        0 |       0 |       0
  voting.service.ts              |   88.65 |    83.48 |   86.66 |   87.05
 server/services/prompts         |       0 |        0 |       0 |       0
```

### iOS `[MACBOOK]`

`ios build plottwists` → exit 70:
```
❌ xcodebuild: error: Unable to find a device matching the provided destination specifier
```
(toolkit defaults to a destination the Mac would not resolve)

Direct `xcodebuild -destination 'platform=iOS Simulator,id=E006AAFF-…'` → first attempt exit 65:
```
error: No space left on device (28) (in target 'PlotTwistsWidgets')
```
`df -h /System/Volumes/Data` → `228Gi total, 198Gi used, 115Mi available (100%)`. Cleared `~/Library/Developer/Xcode/DerivedData` (1.3 GB build cache, regenerable) → 1.2 GiB free. `~/Library/Developer/CoreSimulator` is 17 GB and was **not** touched.

Second attempt → `** BUILD FAILED **`:
```
  2 error: cannot execute tool 'metal' due to missing Metal Toolchain;
    use: xcodebuild -downloadComponent MetalToolchain
```
Swift-source error count: **0** (`grep -cE 'error: .*\.swift|SwiftCompile.*failed'` → 0). The build fails only at Metal shader compilation. The Metal Toolchain component could not be installed — the Mac data volume has ~1.2 GiB free.

**No successful iOS build was produced during this audit.** All Track 6 findings below are from source inspection, not from a running binary.

---

## 6. Test suite composition

30 test files, 397 tests. Distribution:

| Area | Files |
|---|---|
| `server/services/` | 10 (progression, voting, matchmaking, audience, directorsReview, playerStats, gameHistory, credit, room) |
| `stores/` | 7 (subscriptions, gameStore, votingStore, connectionStore, scriptStore, audienceStore, selectionStore) |
| `server/utils/` | 5 (jsonExtractor, timing, validation, retryQueue) + `server/socket/helpers` |
| `lib/` | 5 (roomRecovery, socketManager, betaFeatures, schema, homepagePosterBriefs) |
| `server/handlers/` | 2 (middleware, reconnection) |
| `server/db/` | 1 |

Multi-client / integration tests: **0**. `jest.config.js` `testEnvironment: 'node'`, `testMatch` covers `__tests__/**` only.

---

## 7. Runtime architecture

| Aspect | Fact | Evidence |
|---|---|---|
| Game state store | In-process `Map`s | `server/services/room.service.ts:20-30` — `rooms`, `roomTimeouts`, `plotTwistTimeouts`, `disconnectTimers`, `debouncedWrites` |
| Persistence | Firestore adapter, JSON-file fallback | `server/db/index.ts:12-15` — Firestore only when `FIREBASE_SERVICE_ACCOUNT_KEY` && `NEXT_PUBLIC_FIREBASE_PROJECT_ID` both set |
| Phases | 6 | `lib/types.ts:1-7` — `LOBBY, SELECTION, LOADING, PERFORMING, VOTING, RESULTS` |
| Modes | 3 | `SOLO, HEAD_TO_HEAD, ENSEMBLE` |
| Auth | Clerk, optional | `server/middleware/socketAuth.ts:47-53` — no token ⇒ `userId = null`, connection allowed ("guest mode") |
| Reconnect identity | Client-supplied `playerSessionId` from handshake | `socketAuth.ts:40-46` |
| Server framework | Express 5 + Socket.IO 4.8 + Next.js custom server | `server.ts` |

### Tuning constants (`server/utils/constants.ts`)
```
ROOM_CODE_LENGTH = 4
ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   (32 chars → 1,048,576 codes)
MAX_PLAYERS = { SOLO: 1, HEAD_TO_HEAD: 2, ENSEMBLE: 6 }
ROOM_CLEANUP_INTERVAL     = 5 min
ROOM_INACTIVITY_TIMEOUT   = 60 min
DISCONNECT_GRACE_PERIOD   = 3_000 ms
VOTING_TIMEOUT            = 60_000 ms
PLOT_TWIST_VOTING_DURATION= 15_000 ms
AI_MAX_TOKENS = { ENSEMBLE: 10000, DEFAULT: 8192 }
AI_TEMPERATURE = 1
```
`AUTO_START_THRESHOLD` (`server/services/matchmaking.service.ts:22-26`): `SOLO: 1, HEAD_TO_HEAD: 2, ENSEMBLE: 3` — the minimum non-host players required for `start_game`.

Room codes generated with `Math.random()` — `room.service.ts:142`.

---

## 8. AI layer

| Call site | Model | Notes |
|---|---|---|
| `server/services/scriptGeneration.service.ts:121` | `claude-sonnet-4-5-20250929` | streaming; `max_tokens` 8192/10000; `temperature: 1` |
| `server/services/audience.service.ts:549` | `claude-sonnet-4-5-20250929` | plot-twist options |
| `server/services/audience.service.ts:626` | `claude-sonnet-4-5-20250929` | plot-twist resolution |
| `server/services/directorsReview.service.ts:59` | `claude-sonnet-4-5-20250929` | post-game review |
| `server/services/image.service.ts:6` | `@google/genai` | poster generation |
| `lib/homepagePosterBriefs.ts:16-17` | `gemini-3.1-flash-image-preview` / `gemini-2.5-flash-image` | homepage posters |

Measured prompt size (harness, real code path): **11,938 chars system+user ≈ 2,985 input tokens** per script generation. `getSystemPrompt(false)` alone = 8,909 chars ≈ 2,228 tokens; `getModeInstructions('ENSEMBLE', …)` = 1,339 chars ≈ 335 tokens.

Timeout: hardcoded `STREAM_TIMEOUT_MS = 120_000` (`scriptGeneration.service.ts:170`).

Dead configuration in `server/utils/config.ts` — declared but never read anywhere in `server/` or `lib/`:
- `CONFIG.generation.model` (env `ANTHROPIC_MODEL`) — model is hardcoded at the call site
- `CONFIG.generation.timeoutMs` (45 s) — actual timeout is the hardcoded 120 s
- `CONFIG.rateLimits.*` (9 entries) — handlers each construct their own `SocketRateLimiter` with different numbers

---

## 9. Content library

`lib/content.ts`:
- **252** character entries (`grep -c "id: 'char-"`)
- **375** `source:` fields across all card types
- **114** distinct named franchises

Top franchises by character count:
```
14 Marvel          13 Lord of the Rings   12 Star Wars      11 Harry Potter
 8 Breaking Bad     7 The Wizard of Oz     7 The Office      7 The Good Place
 7 Parks and Recreation  7 Guardians of the Galaxy  7 Friends  7 Brooklyn Nine-Nine
 6 The Sopranos     6 The Boys             5 The Wire        5 The Simpsons
 5 The Lion King    5 Ted Lasso            5 Succession      5 Stranger Things
 5 Star Trek        5 Shrek                5 Seinfeld        5 Scooby-Doo
 5 Rick and Morty
```
Category distribution: sitcom 113, animation 104, crime 79, scifi 42, action 42, fantasy 38, classic 23, workplace 19, horror 14, mystery 11, adventure 10, romance 6.

Named real living person in the library: `lib/content.ts:340`
```ts
{ id: 'char-jerry-seinfeld', name: 'Jerry Seinfeld', category: 'sitcom',
  tags: ['comedian','neat','cereal','nothing'], maturity: 'safe', source: 'Seinfeld' }
```

Bundled crossover artwork in the iOS binary (`PlotTwists/Shared/Resources/Assets.xcassets/`): `shrek-in-seinfeld`, `barbie-in-breaking-bad`, `darth-vader-in-the-office`, `ned-stark-in-hannah-montana`, `lightning-mcqueen-in-the-sopranos`, `wednesday-addams-in-baywatch`.

The system prompt instructs the model about specific IP — `server/services/prompts/comedyPrompts.ts:415`:
```
- "The Death Star" → This is Star Wars. Natives: Darth Vader, Stormtroopers, Imperial Officers
```

---

## 10. Observability & CI

| Item | State |
|---|---|
| Error tracking | **None.** No Sentry / Bugsnag / Rollbar / Datadog in `package.json` or source |
| Logging | `lib/logger.ts` — `console.debug/log/warn/error` with a `LOG_LEVEL` gate. No transport, no aggregation |
| CI workflows | `.github/workflows/claude-code-review.yml`, `.github/workflows/claude.yml` — both Claude Code integrations. **No workflow runs build, typecheck, or tests** |
| Backup/restore | No scripts, no documented procedure |

---

## 11. Design tokens

Tokens defined in `app/globals.css` (516 lines) and `lib/design.ts`:
- `--font-display: var(--font-fredoka, 'Fredoka')` (line 15)
- `--font-body: var(--font-dm-sans, 'DM Sans')` (line 16)
- `--color-accent: #F59E42` (line 47)
- `--color-theater-bg: #09090B` (line 122) — the brief documents `#0C0C0E`
- `--color-theater-text: rgba(255,255,255,0.92)`, `--color-theater-muted: rgba(255,255,255,0.50)`

Adherence counts across `app/` + `components/` (`.tsx`/`.ts`, excluding `globals.css`):

| Measure | Count |
|---|---|
| `var(--*)` references | 2,080 |
| Hardcoded 6-digit hex literals | 261 (across 43 files) |
| `rgb()`/`rgba()` literals | 619 |

iOS (`PlotTwists/Shared/Views/`, `.swift`):

| Measure | Count |
|---|---|
| Token references (`PT.`, `Colors.`, `.ptX`) | 2,008 |
| `Color(hex:)` / `Color(red:)` literals | **0** |

Theme files present on iOS (`PlotTwists/Shared/Theme/`): Animations, Avatars, Colors, Effects, GameModeTheme, GlassComponents, LiveSpotlight, LivingBackground, PTCurtainLine, ScreenTransition, Shaders, StageAtmosphere, Styles, Typography.

**"Reely" appears zero times in either codebase.** `grep -rn -i "reely"` → 0 matches in `/root/Plot-Twists/{app,components,lib,public}` and 0 matches in `/root/PlotTwists-Native/PlotTwists/**/*.swift`. (One incidental hit in a font licence file, `Resources/Fonts/OFL.txt`.)

---

## 12. Debt markers

### iOS
| Marker | Count |
|---|---|
| `try!` / `as!` / `.unsafelyUnwrapped` | **0** |
| `print(` | 5 |
| TODO / FIXME / HACK | 15 |

### Web
- Secrets scan across full history (`git log --all -p` for `sk-ant-*`, `AIza*`, `sk_live_*`): **0 matches**
- `.env` not present; `.env.example` present (2,562 bytes)
- Dead exports confirmed: `server/middleware/rateLimiter.ts` exports `apiRateLimiter`, `roomCreationLimiter`, `scriptGenerationLimiter`, `gameMetadataLimiter` (express middlewares) — none are referenced outside that file. Only the `SocketRateLimiter` class is used.
- `lib/schema.ts` `submitCardsSchema` (zod) is defined but unused; `selection.handler.ts` uses `validateCardSelection` from `server/utils/validation.ts` instead.

---

## 13. Rename surface

Occurrence counts for case/hyphenation variants.

### Web (`.ts`, `.tsx`, `.json`, `.js`, `.css`, `.md`, `.yml`, `.toml`; excludes `node_modules`, `package-lock.json`)
| Pattern | Occurrences |
|---|---|
| `Plot Twists` | 122 |
| `PlotTwists` | 84 |
| `plottwists` | 84 |
| `plot-twists` | 35 |
| `plot-twists.com` | 27 |
| `plot_twists` | 0 |
| **Total across 98 files** | **377** |

### iOS (`.swift`, `.yml`, `.plist`, `.pbxproj`, `.entitlements`; excludes `build/`)
**349** occurrences.

### Load-bearing identifiers
| Kind | Value | Location |
|---|---|---|
| Bundle ID prefix | `com.plottwists` | `project.yml:3` |
| Bundle IDs | `com.plottwists.app`, `.app.widgets`, `.tv`, `.tests` | `project.yml:53,88,115,142` |
| Universal links | `applinks:plot-twists.com`, `applinks:www.plot-twists.com` | `PlotTwists/iOS/PlotTwists.entitlements:13-14` |
| AASA appIDs | `2MU4PC84GZ.com.plottwists.app` | `public/.well-known/apple-app-site-association` |
| Android assetlinks | `"package_name": "com.plottwists.app"`, `"sha256_cert_fingerprints": ["TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT"]` | `public/.well-known/assetlinks.json` |
| PWA manifest | `"name": "Plot Twists - AI Improv Comedy Game"`, `"short_name": "Plot Twists"` | `public/manifest.json` |
| npm package | `"name": "plot-twists"` | `package.json:2` |
| Production CORS allowlist | `https://plot-twists.com`, `https://www.plot-twists.com`, `https://web-production-c7981.up.railway.app` | `server.ts:32-34` |
| Vercel preview regex | `/^https:\/\/plot-twists(-[a-z0-9-]+)*\.vercel\.app$/` | `server.ts:44` |
| iOS production socket URL | `https://web-production-c7981.up.railway.app` | `PlotTwists/Shared/Config.swift:30` |

### External-name landscape (checked live, 2026-07-28)
| Source | Query | Result |
|---|---|---|
| iTunes Search API | `term=plotslop&entity=software&limit=25` | resultCount 10, **no exact match** — all fuzzy hits on "plot" (Story Plotter, Plot Flow, Zen Plot, MultiPlot, StoryCharts, …) |
| Web search | `"PlotSlop" OR "Plot Slop" trademark USPTO` | No matching trademark records returned |
| Web search | `"plotslop" app OR game OR domain 2026` | No matching app, game, or domain |
| `trademarks.justia.com` | `?q=plotslop` | HTTP 403 (bot-blocked) — could not query |

---

## 14. Harness built for this audit

`scripts/harness/` (new, committed to the working tree, not pushed):

| File | Purpose |
|---|---|
| `mock-anthropic.ts` | HTTP server speaking the Anthropic Messages protocol (streaming SSE + non-streaming JSON). Fault modes: `ok`, `slow`, `malformed`, `truncated`, `error` (529), `hang`. Records prompt size, model, `max_tokens`. |
| `server.ts` | Boots the **real** `registerAllHandlers` + `createSocketAuthMiddleware` on a bare Socket.IO server. No Next.js, no Firestore (JSON adapter fallback). |
| `run.ts` | 10 scenarios driving 1–8 `socket.io-client` instances through complete games with injected disconnects and abuse. |

The production code path is unmodified — only the HTTP shell and the Anthropic endpoint are substituted (via `ANTHROPIC_BASE_URL`, which the SDK honours). Streaming, progress milestones, `extractJSON`, and Zod validation all execute for real.

Run: `[VPS] cd /root/Plot-Twists && ANTHROPIC_API_KEY=sk-ant-harness-fake npx tsx scripts/harness/run.ts`

Result: **17 / 24 checks passed.** Full output in `AUDIT.md` per finding.

---

## 15. Limitations of this audit

Stated up front; every affected finding is marked with reduced confidence.

1. **No API keys on this host.** No `.env` exists. AI cost and latency figures are computed from measured token counts against published pricing, not from a live billed run.
2. **No successful iOS build.** Metal Toolchain absent; Mac data volume at 100%. Track 6 is source-inspection only.
3. **`next build` does not complete** without a Clerk publishable key, so no route-level bundle-size table was produced. Bundle figures are from the partial `.next` output.
4. **No Railway / App Store Connect / Firebase / Clerk console credentials.** External-system state (is the Railway project deleted or just unlinked? what is in App Store Connect?) is in `DECISIONS.md`, not asserted here.
5. **No mid-tier Android device.** Track 5 frame-rate claims would require throttled emulation, which was not run.
6. **The brief names Supabase; this stack uses Firestore.** The "RLS policies" track has no target. Firestore security rules were looked for and are not present in either repo — there is no `firestore.rules` file.
