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
| Loading / generation (`app/game` loading) | generating, long-wait, error/retry | 2• | 2• | 2• | 2• | 2• | Longest forced wait in the game; should feel like a title sequence, likely feels like a spinner. |
| Performing — host screen (`ScriptViewer` path) | active line, scene headings, 8-cast | 3• | 3• | 3• | 2• | 3• | Screenplay format is the star; Courier is right. |
| Performing — teleprompter (`MobileTeleprompter`) | my turn, not my turn, reduced-motion, rejoin | 3• | 2• | 3• | 3• | 4• | Short labels landed (§15) but recorded as "legible and uglier". Identity comparison (`isMyTurn`) is untouchable; styling only. |
| Voting | ballot, waiting-for-others, tie | 3• | 3• | 3• | 2• | 3• | |
| Results (`DirectorsReview`, winner) | winner reveal, scores, share | 3• | 3• | 3• | 2• | 3• | Should feel like an award ceremony; billing-block texture belongs here. |
| Replay viewer (`app/replay/[code]`) | found, not-found, empty | 3• | 3• | 3• | 3• | 3• | |
| Clips / digest (`app/clips`, `app/digest`) | populated, empty | 3• | 3• | 3• | 3• | 2• | |
| Profile (`app/profile`) | signed-in, history, empty history | 3• | 3• | 3• | 3• | 3• | |
| Explore (`app/explore`) | packs, empty | 3• | 3• | 3• | 3• | 3• | |
| Purchase / credits (`app/purchase`, `CreditStoreSheet` analog) | store, success, failure | 3• | 3• | 3• | 3• | 3• | |
| System states (`GameErrorBoundary`, `GamePausedOverlay`, `ConnectionStatus`, `not-found`) | error, paused, reconnecting, 404 | 2• | 2• | 3• | 2• | 3• | Reconnecting is a live-party moment — deserves calm confidence, not alarm. |

## iOS (`/root/PlotTwists-Native`, branch design/2026-08-06)

Shelved & re-scoped to host/TV surface (DECISIONS #12) — rows biased toward
screens that survive that re-scope. Gate: `ios build` exit 0 + simulator
screenshot critique. Never `ios ship`/`ios install`.

| Screen | Key states | H | T | S | M | St | Notes |
|---|---|---|---|---|---|---|---|
| Cold open / welcome (`ColdOpenView`, `WelcomeView`) | first launch, reduced-motion | 3• | 3• | 3• | 3• | 3• | Already the app's showpiece per repo CLAUDE.md. |
| Home (`HomeTab`: `PosterHero`, `CinemaHeader`, `ScreeningBoard`) | populated, empty, offline | 3• | 3• | 3• | 3• | 2• | Six bundled posters deleted in 4a — whatever referenced them needs a non-IP replacement state. |
| Lobby (`LobbyView`) | 0/2/8 players, disconnect | 3• | 3• | 3• | 3• | 3• | Survives re-scope (host surface). |
| Performing (`PerformingView`) | active line, reduced-motion | 3• | 3• | 3• | 3• | 3• | Survives re-scope (TV/host surface). |
| Results (`ResultsView`) | winner, scores | 3• | 3• | 3• | 3• | 3• | Survives re-scope. |
| Voting (`VotingView`) | ballot, waiting | 3• | 3• | 3• | 3• | 3• | Player-surface — low priority under re-scope. |

## Iteration log

| N | Surface | What was tried | Score delta | Commit |
|---|---|---|---|---|
| 0 | — | Setup: tokens spine, NORTH-STAR, this ledger, gate tooling, baselines | — | (see git log) |
| 1 | Homepage | Marquee → studio pitch + one-sheet. First draft critiqued and reworked before commit: sub-copy was center-drifted on desktop, poster had a bare-gradient void (title moved center as the art), credits label was a naked "1-8". axe found 6 contrast nodes (incl. 4 pre-existing nav) + heading-order — all fixed. | H 1→4, T 1→4, S 2→4, M 2→3, St 2→3 | (this commit) |
