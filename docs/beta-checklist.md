# Plot Twists Beta Checklist

Private beta targets a dependable core loop first: host, join, perform, recover, finish, and inspect.

## Readiness Matrix

| Area | Status | Exit Criteria |
| --- | --- | --- |
| Host / Join Core Loop | In progress | Create room, join room, submit cards, generate script, perform, vote, and restart without blockers on desktop + mobile web |
| Recovery / Resume | In progress | Guest and signed-in players can refresh or reconnect into the active room without losing role or phase |
| Public Matchmaking | Gated by flag | Thresholds, countdowns, overflow, and reconnect behavior are verified end-to-end |
| Purchases / Credits | Gated by flag | Stripe and StoreKit purchases reconcile correctly and credit balance refresh is reliable |
| Audience Features | Gated by flag | Reactions, plot twists, and spectator chat remain stable and moderated under live load |
| Card Packs | Gated by flag | Browse, select, create, and delete flows are reliable and safe for beta testers |
| Replays / History | In progress | Finished games persist correctly and replay pages load from shared links |
| Admin / Ops | In progress | Operators can inspect active rooms, users, feature gates, and failure logs quickly |
| iOS Shell | In progress | Resume, wake-lock-adjacent behavior, and purchase handoff match the web source of truth |

## Release Blockers

- Wrong room state after refresh or reconnect
- Host or player stuck between phases
- Server accepts invalid start-game transitions
- Public countdown starts or continues with too few players
- Credit balance or purchase result disagrees with what the user sees
- Replay or profile data disagrees with the just-finished session

## Feature Flags

Set these to `false` to hide unfinished areas without deleting them:

- `NEXT_PUBLIC_BETA_ENABLE_PUBLIC_MATCHMAKING`
- `NEXT_PUBLIC_BETA_ENABLE_PURCHASES`
- `NEXT_PUBLIC_BETA_ENABLE_AUDIENCE`
- `NEXT_PUBLIC_BETA_ENABLE_CARD_PACKS`
- `NEXT_PUBLIC_BETA_ENABLE_REPLAYS`
- `NEXT_PUBLIC_BETA_ENABLE_ADMIN`

Server-side companions:

- `BETA_ENABLE_PUBLIC_MATCHMAKING`
- `BETA_ENABLE_PURCHASES`
- `BETA_ENABLE_AUDIENCE`
- `BETA_ENABLE_CARD_PACKS`
- `BETA_ENABLE_REPLAYS`
- `BETA_ENABLE_ADMIN`

## Smoke Test Before Deploy

1. Host creates an ensemble room and three players join.
2. One player refreshes during lobby and recovers.
3. All players submit cards and script generation reaches performing.
4. One player refreshes during performing and recovers teleprompter state.
5. Host ends performance, voting completes, and results render.
6. Replay link opens and profile/history reflect the finished game.
