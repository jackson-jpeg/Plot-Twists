# DESIGN LEDGER — screen × state scores

Protocol (2026-08-06): each iteration picks the **lowest-scoring row**, works
it until every axis clears **4/5**, then moves on. Axes: **H**ierarchy,
**T**ypography, **S**pacing/rhythm, **M**otion, **St**ate completeness.
Scores marked `•` are provisional (from code reading + recorded findings, not
yet verified against a screenshot) — verify and re-score on first visit.
Update this file every iteration: new scores + what was tried (including
reverts). Stop condition: two consecutive iterations with no rubric
improvement.

State matrix to check per screen (not every state applies everywhere):
empty · loading · error · socket disconnected/reconnecting · 2 players ·
8 players · 40-char player names · keyboard-open on mobile · mid-round rejoin
· prefers-reduced-motion.

## Web (`/root/Plot-Twists`, branch design/2026-08-06)

| Screen | Key states | H | T | S | M | St | Notes |
|---|---|---|---|---|---|---|---|
| Homepage / landing (`LandingPage`, `PosterOneSheet`) | signed-out, signed-in, mobile strip bug | 4 | 4 | 4 | 3 | 3 | **Iter 1 (verified by screenshot):** marquee gone; studio-pitch layout — serif sentence-case hero, ONE accent (stage gold), one rotating type-driven one-sheet as the star, billing-block texture, dots not rows. "Now Showing" ×0. Strip bug fixed (body bg scoped). Nav contrast raised (was 1.95:1). axe 0 violations; LCP 2032→1120ms (m390); CLS 0.17→0.088 (d1440). Open: motion is entrance+crossfade only (M=3); signed-in variant unverified; residual 0.088 CLS (suspect serif font swap). |
| Join form (`JoinForm`) | entry, bad code, full→spectator toast, keyboard-open | 3• | 2• | 3• | 2• | 4• | Spectator handling is complete (§13); visual register unknown. |
| Join lobby (`JoinLobby`) | waiting, spectator mode, disconnect/reconnect | 3• | 3• | 3• | 2• | 4• | Spectator mode state exists and explains itself. |
| Host create (`app/host`) | mode select, room settings | 3• | 3• | 3• | 2• | 3• | |
| Host lobby (`HostLobby`) | 0 joined, 2, 8 full + audience group, start gate | 3• | 3• | 3• | 2• | 4• | Cast/Audience split shipped 2026-07-30. Join-instruction block is the party's front door — deserves star treatment. |
| Card selection (`CardPicker`, `CardCarousel`, `CardBrowseModal`) | dealing, picked, browse, 40-char traits | 3• | 3• | 3• | 3• | 3• | Cards are the physical objects — springs allowed here. |
| Loading / generation (`HostLoading`) | generating, long-wait, error/retry | 4 | 4 | 4 | 4 | 4 | **Iter 2 (verified, 4 states via design-preview harness):** the wait is now the one-sheet being typeset — full poster grammar, title streams into the sheet, steps became billing credits (Casting/Staging/Screenplay) that materialize with progress, stage-red ribbon accent, italic serif status. Grey mask-smudge gone; "Untitled" ghost for pre-title. axe 0 across states (fixed Retry 3.76:1, ghost-btn 3.96:1, added sr-only h1). JoinLoading (player side) not yet touched — same treatment when its row comes up. |
| Performing — host screen (`ScriptViewer` path) | active line, scene headings, 8-cast | 3• | 3• | 3• | 2• | 3• | Screenplay format is the star; Courier is right. |
| Performing — teleprompter (`MobileTeleprompter`) | my turn, not my turn, reduced-motion, rejoin | 3• | 2• | 3• | 3• | 4• | Short labels landed (§15) but recorded as "legible and uglier". Identity comparison (`isMyTurn`) is untouchable; styling only. |
| Voting | ballot, waiting-for-others, tie | 3• | 3• | 3• | 2• | 3• | |
| Results (`DirectorsReview`, winner) | winner reveal, scores, share | 3• | 3• | 3• | 2• | 3• | Should feel like an award ceremony; billing-block texture belongs here. |
| Replay viewer (`app/replay/[code]`) | found, not-found, empty | 3• | 3• | 3• | 3• | 3• | |
| Clips / digest (`app/clips`, `app/digest`) | populated, empty | 3• | 3• | 3• | 3• | 2• | |
| Profile (`app/profile`) | signed-in, history, empty history | 3• | 3• | 3• | 3• | 3• | |
| Explore (`app/explore`) | packs, empty | 3• | 3• | 3• | 3• | 3• | |
| Purchase / credits (`app/purchase`, `CreditStoreSheet` analog) | store, success, failure | 3• | 3• | 3• | 3• | 3• | |
| System states (`GameErrorBoundary`, `GamePausedOverlay`, `ConnectionStatus`, `not-found`) | error, paused, reconnecting, lost, 404 | 4 | 4 | 4 | 4 | 4 | **Iter 3 (verified, 5 states):** reconnect banner is now a calm gold "Hold, please" lamp with "take N" counter (red reserved for true loss); paused overlay → deadpan Intermission card (ink world, no emoji, no bounce); 404 → cutting-room-floor title card matching the homepage world; error boundary → "We lost the plot." retake card. ConnectionStatus split into presentational ConnectionBanner + context glue (harness-testable; logic identical). Pre-existing lint error (setState-in-effect) replaced with useSyncExternalStore. axe 0 on all five. |

## iOS (`/root/PlotTwists-Native`, branch design/2026-08-06)

Shelved & re-scoped to host/TV surface (DECISIONS #12) — rows biased toward
screens that survive that re-scope. Gate: `ios build` exit 0 + simulator
screenshot critique. Never `ios ship`/`ios install`.

| Screen | Key states | H | T | S | M | St | Notes |
|---|---|---|---|---|---|---|---|
| Cold open / welcome (`ColdOpenView`, `WelcomeView`) | first launch, reduced-motion | 4 | 4 | 3• | 3• | 4 | **Iter 4:** five franchise teleprompter scenes → archetype scenes (verified on-device); welcome carousel → TypographicOneSheet (compile-verified; visual pass pending — no UI-driving path tonight). |
| Home (`HomeTab`: `PosterHero`, `CinemaHeader`, `ScreeningBoard`) | populated, empty, offline | 4• | 4• | 3• | 3• | 4 | **Iter 4:** hero + strip now draw from ShowcasePremieres (title-as-art + scaled one-sheets); dead image-cache machinery removed. Visual pass pending, same reason. |
| Lobby (`LobbyView`) | 0/2/8 players, disconnect | 3• | 3• | 3• | 3• | 3• | Survives re-scope (host surface). |
| Performing (`PerformingView`) | active line, reduced-motion | 3• | 3• | 3• | 3• | 3• | Survives re-scope (TV/host surface). |
| Results (`ResultsView`) | winner, scores | 3• | 3• | 3• | 3• | 3• | Survives re-scope. |
| Voting (`VotingView`) | ballot, waiting | 3• | 3• | 3• | 3• | 3• | Player-surface — low priority under re-scope. |

## Iteration log

| N | Surface | What was tried | Score delta | Commit |
|---|---|---|---|---|
| 0 | — | Setup: tokens spine, NORTH-STAR, this ledger, gate tooling, baselines | — | (see git log) |
| 1 | Homepage | Marquee → studio pitch + one-sheet. First draft critiqued and reworked before commit: sub-copy was center-drifted on desktop, poster had a bare-gradient void (title moved center as the art), credits label was a naked "1-8". axe found 6 contrast nodes (incl. 4 pre-existing nav) + heading-order — all fixed. | H 1→4, T 1→4, S 2→4, M 2→3, St 2→3 | ec301925 |
| 2 | Loading screen | HostLoading → "the one-sheet being typeset". Built design-preview harness (page.preview.tsx + pageExtensions gate — REQUIRED after the naive route blew the bundle cap at +22k; deploy-equivalent build is +2,035 B). Critique loop caught: empty pre-title poster (→ Untitled ghost), orange Retry in red danger context, ghost-button light-mode text on void. axe 0 across 4 states. | H 2→4, T 2→4, S 2→4, M 2→4, St 2→4 | 4e6e21cc |
| 3 | System states | Alarm → intermission register across ConnectionBanner / GamePausedOverlay / GameErrorBoundary / 404. Harness grew system fixtures (incl. a deliberate render-thrower). axe fixes: stage-red micro-type 3.6:1 on ink (lightened), 404 nested main landmark, billing line 3.95:1. | H 2→4, T 2→4, S 3→4, M 2→4, St 3→4 | b4adc833 |
| 4 | iOS marketing surfaces | Archetype premieres ported to iOS (ShowcasePremieres + TypographicOneSheet); five cold-open franchise scenes rewritten; franchise render briefs DELETED from PosterGenerationService; ContentSourceAuditTests added (iOS twin of the web IP gate). Also un-rotted the shelved repo: baseline was RED (13 errors, verified by stash-build) — iOS 26 glass/tab APIs availability-gated, type-checker timeout split exposed+fixed a masked real error, Metal toolchain installed, Mac disk 100%→97% (DerivedData purge). ios build exit 0; cold open verified in simulator. | Cold open/welcome H3→4 T3→4 St3→4; Home H→4• T→4• St2→4 | e90a28db (iOS repo) |
| 3b/3c | Bundle regression hunt | design(3) deploy bundle came out +23k (cap +15k) and the commit message claimed otherwise unverified — caught by measuring. Two wrong theories (tokens-module duplication ×2) each disproven by measurement; real cause found by counting module copies: dropping ConnectionStatus's `ui/Button` import un-anchored Button from the shared chunk and Turbopack duplicated it into all 11 consumer routes (1 copy → 11). Fix: banner Retry is a ui/Button again (comment explains the anchor). Deploy bundle 2,108,004 = +1,659 vs baseline. Bonus hardening: lib/motion holds literal EASE_CAMERA/DUR with a jest drift-gate against design/tokens (suite 553 → 555); leaf components use CSS custom properties for colors. | — (gate fix) | (this commit) |
