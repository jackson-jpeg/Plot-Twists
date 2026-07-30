# Session — 2026-07-30, evening pass

**The seat cap decision, executed.** Everything you asked for in the four numbered items is done,
plus the measurement you asked for at the end. It is deployed and verified.

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

---

## Deployed, and it uncovered a route that has never worked

**Live as of 18:38 UTC.** You ran `deploy.sh`; it took its abort path at the restart prompt again
(no TTY, so `read` got EOF and it correctly refused to assume consent). I checked the window —
**zero** established connections on :3100, `rooms.json` = `items: []` — and completed the restart.

Then I curled the OG routes instead of assuming a rebuilt page renders. **The invite-link card —
the link you send people to join — was returning HTTP 500, and had been since the day it was
built.**

```
⨯ TypeError: Cannot read properties of undefined (reading 'toUpperCase')
```

`params` is a **Promise** in Next 15+, and that route destructured it synchronously. Every sibling
route in this repo already awaits it. So nobody pasting a join link into iMessage or Discord has
ever seen a preview card.

**It also means the localhost fix I shipped an hour earlier was never reachable in that file** —
the throw is two lines above the fetch. Two defects stacked, the outer hiding the inner.
`app/replay/[code]/opengraph-image.tsx` had the identical bug with a quieter symptom: `undefined`
in a template literal, so it fetched `/api/game/undefined` and silently drew the generic card.

**The lesson is mine.** `tsc`, `jest`, `next build` and a grep of the shipped bundle were **all
green** on a route that returns 500 to every caller. Compiling is not responding. Curl the endpoint.

| Check after the fix and second restart | |
|---|---|
| Service | active, **0 errors** since restart |
| apex / www / sang3r.com | 200 / 200 / **200** |
| Seat cap **over TLS** | `ENSEMBLE:8` in all three cap-bearing chunks; **zero** `ENSEMBLE:6` |
| Old copy strings in deployed JS | `3-6 performers` 0 · `1-6 Players` 0 · `?2:8` 0 |
| Root / **invite** / replay OG cards | 200 135 KB · **200 118 KB** · 200 117 KB |
| `/api/room-preview/TEST` via the public origin | `{"error":"Room not found"}` — the route `API_ORIGIN` now reaches |

---

## 1. The cap is 8, and no count is typed anywhere any more

`MAX_PLAYERS.ENSEMBLE = 8`. A new `MIN_PLAYERS` sits beside it, because `matchmaking.service.ts`
had been keeping its own private copy of the floor — so a change to the seat range could have
landed in the lobby and missed matchmaking entirely. It is now an alias.

`lib/playerCounts.ts` is new and is the only place a seat count becomes English.

**You asked me to fix three UI strings. There were twelve sites across nine files, and three of
them were not strings.**

| | |
|---|---|
| `HostLobby.tsx:338` | `Max {gameMode === 'HEAD_TO_HEAD' ? 2 : 8}` |
| `HostLobby.tsx:502-504` | `'1 player vs AI'`, `'2 performers + host'`, `'3-6 performers + host'` — **three** literals, not the one the record named |
| `HostLobby.tsx:111-133` | `canStartGame` and `getMinPlayers()` each restated the floor as `2`/`3` |
| `JoinForm.tsx:711` | `'3-6 performers'` |
| **`app/opengraph-image.tsx:99`** | **`'1-6 Players'`** — the root marketing OG card. **Missed entirely** by every previous sweep, including mine. |
| `app/join/invite/[code]/opengraph-image.tsx:34` | `?? 8`. My earlier note cited this as `opengraph-image.tsx:34`, which is a *different file* — and that ambiguity is part of why the root card above went unfound. |
| **`room.handler.ts:355`** | **`activePlayers.slice(0, 6)`** — not a string. At a cap of 8 it would have silently dropped two names from every invite preview. |
| **`matchmaking.service.ts:22`** | the second copy of the floor |
| `scripts/real-generation.ts:54` | `const PLAYERS = 8` |
| **`scripts/harness/run.ts:758`** | `length: 6` in `spectatorVote` |

**Why my own grep missed two of these.** I searched for the numbers I already knew about — `3-6`,
`Max 8`. `'1-6 Players'` and `slice(0, 6)` both survive that. What found them was searching for the
*shape* — a digit next to a player noun — and then reading every reader of the constant.

---

## 2. The test that did not exist, and a guard that would have caught the whole thing

`__tests__/unit/server/utils/playerCounts.test.ts` — **19 assertions**. Unit suite **450 → 469**.

Two kinds, failing for different reasons:

- **Value assertions** pin the numbers. Changing the cap *should* break these; whoever changes it
  should have to come here and say so on purpose.
- **A drift guard** reads the real UI source and fails if a bare player-count literal reappears.
  This is the one that catches the actual historical bug, because it fails even when someone
  "fixes" the copy by editing a string rather than deriving it.

**I did not trust the guard on the strength of it passing.** A guard that matches nothing passes
forever. So I put `'1-6 Players'` back into `app/opengraph-image.tsx`, ran it, confirmed it went
red on that exact file, and restored. Then a second check inside the test asserts the guard fires
on all three verbatim strings that shipped and does *not* fire on their derived replacements.

### The harness gate was a false green in two separate ways

```diff
- record('playerCount', 'ENSEMBLE caps PLAYER seats at 6', asPlayer <= 6, ...)
+ record('playerCount', `ENSEMBLE seats exactly MAX_PLAYERS (${CAP}) — no more, and no fewer`,
+   asPlayer === CAP, ...)
```

1. The cap was hardcoded as `6` while `MAX_PLAYERS` was the thing under test.
2. **`asPlayer <= 6` is satisfied by `asPlayer === 0`.** A server that refused every joiner passed
   this gate. Now an equality, and the scenario over-joins by two so the spectator path stays
   exercised at any cap.

**And a second hardcoded 6 that no grep of mine found.** `spectatorVote` filled the room with
`length: 6` clients so the 7th would overflow. At a cap of 8 that "spectator" joined as a PLAYER
and every spectator assertion below it stopped measuring a spectator. It surfaced only because the
harness went **red** when the cap moved — which is the entire argument for making fixtures derive
from the constant instead of restating it. Harness **49 → 50**.

---

## 3. Spectators — and a correction, because "silent demotion" was wrong

You asked me to make the overflow role stated rather than silent. **It already was, on the
joiner's side, and the record said otherwise in two places:**

- `JoinForm.tsx:259` — `toast.info('Room is full! You joined as a Spectator.')`
- `JoinLobby.tsx:79` — the lobby headline renders **"Spectator Mode"** with an eye icon, and
  explains *"Sit back and enjoy the show! You can vote at the end."*

**The party that was not told was you.** `HostLobby.tsx:109` built the cast as
`players.filter(p => !p.isHost)` — spectators included. So the host saw `Cast (9)` under `Max 8`
with nothing indicating that two of those people would never appear in the script, and that same
count fed the start gate.

Fixed: the cast is `role !== 'SPECTATOR'`, and spectators render in their own **Audience (N)**
group with the line *"The cast is full at 8, so they watch and vote instead of performing."*

---

## 4. Re-run at 8 — and the number you asked for

Three fresh generations against the live API through the production path. `$0.11` spent.

`PLAYTEST-2026-07-29.md` → **`PLAYTEST-2026-07-30.md`**, with a new section, *How much each player
actually says*, so this measurement lives in the artefact rather than only in a message.

### Cost

| | |
|---|---:|
| script generation (mean of 3) | $0.0353 |
| director's review | $0.0047 |
| **one complete round** | **$0.0400** |

Against $0.0407 before — statistically the same, which is the expected result: the prompt is
fixed-size and the line budget is a constant, so cast size barely moves cost. $9 still buys ~225
rounds.

### Lines per player: **4.71**, and the mean is the flattering number

| | |
|---|---|
| Mean per seated player | **4.71** — under your threshold of 5 |
| **Median across every speaker** | **3.5** |
| Range | **2 - 12** |
| Distinct speakers the model wrote | **9, 8, 9** — against 8 traits |

The model does not divide the budget evenly. One character took **11 of 38** lines in one script
and **12 of 38** in another; three speakers got **2**. Two of the three scripts invented a **ninth**
character, whose lines still have to be read by someone in the room.

So the realistic experience at 8 is not "everyone gets 4.7" — it is one person carrying the scene
while two or three hold two lines each and wait.

### Recommendation: **42-52 lines, and `max_tokens` 2,600 → 3,000. Not applied.**

| | |
|---|---|
| **Why the range widens rather than shifts** | A narrow band is what forces the model to pay for a ninth character by starving three others. Ten lines of slack lets it seat everyone without cutting the busiest part. |
| **52 ≈ 6.5 per seat, median ~5** | Puts the *median* above your threshold. Aiming the mean at 5 leaves half the room below it. |
| **`max_tokens` 3,000** | Measured output is 39 tokens/line. 52 lines ≈ 2,030 — 78% of the current ceiling, too close for a model that occasionally writes long. |
| **Runtime: +40 seconds** | 38 lines is **1.8 min** of reading at 120 wpm (5.8 words/line, measured). 52 lines is **2.5 min**. Your "seventy lines is where a party stops being fun" was about ~3.4 min. |
| **Money: +15%** | $0.0400 → ~$0.0437. $9 buys ~206 rounds instead of ~225. |

**The honest caveat:** raising the budget raises the floor, it does not fix the skew. If the
playtest complaint is *"one person did all the talking"* rather than *"I didn't get to say much"*,
the fix is a per-character line-share instruction in the prompt, not a bigger budget. I would
rather you learn that from eight real people than have me guess now.

---

## What I found that contradicts the written record — six more

You told me to assume it had happened again and go looking. It had — **six times**, and the two worst are mine. The sixth (the invite card's 500) is at the top of this file, because it was found after the deploy.

### 🔴 "The localhost OG bug is dead" was written after verifying the half that could not fail

Yesterday I gave you a verification table with *"zero `localhost:3000` on the live site"*. That
check was real. It covered `/opengraph-image` — **the one image route that does not fetch
anything.** Four sibling routes did:

```
app/join/invite/[code]/opengraph-image.tsx    ← the INVITE-LINK card. The join path.
app/api/poster-story/[gameId]/route.tsx
app/api/character-card/[gameId]/[playerId]/route.tsx
app/api/clip-card/[gameId]/route.tsx
```

Each wrote `process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'`. That variable is **not set**
in `/etc/plotslop/env`, and `NEXT_PUBLIC_*` is inlined at build time, so the literal was baked in.

Confirmed two ways, per rule 2.2:

1. `systemctl show plotslop` → the unit's **`PORT=3100`**.
2. `curl -s http://localhost:3000/ | grep '<title>'` → **`<title>Jackson Sanger</title>`**, against
   `:3100` → `<title>PlotSlop - AI Improv Party Game</title>`.

**Port 3000 on this box is sang3r.com.** Every one of those four fetches went to your personal
site, 404'd, and the card fell back to its generic form. It failed *quietly* — an invite preview
that still renders *something* looks fine — which is why nothing surfaced it.

Two of those four files **already imported `SITE_DOMAIN`**. The rename sweep opened them, fixed the
domain they *displayed*, and left the domain they *fetched*, because a grep for dead brand names
does not match "localhost". Fixed with a new `API_ORIGIN` in `lib/siteUrl.ts`.

**"I verified it" is not "I verified the thing that was broken."** The claim I should have made was
*"the root OG card is fixed"*, which is what I actually tested.

### The other four

| | |
|---|---|
| **`SocketContext.tsx:121`** | Built `https://localhost:3000` in the production SSR bundle — falls back to the literal, then prefixes `https://`. A value that can never connect. SSR-only, so no user-visible failure, but it shipped. |
| **The blast radius undercounted the UI 4×** | "Three hardcoded numbers, all strings." Twelve sites; three not strings. |
| **"Silently demoted to SPECTATOR"** | Asserted in `NEEDS-JACKSON.md` and in the harness message itself. False in both — §3 above. |
| **`INVENTORY.md`'s constant table** | `VOTING_TIMEOUT` listed as `60_000`; it has been **25_000** since Chunk 2. And `AI_MAX_TOKENS = { ENSEMBLE: 10000 }` listed as live tuning when **nothing imports it** and the real ceiling is **2,600**. A dead constant in the inventory claiming 4× the true limit is a trap for the next session that reads it to find out what the limits are. Constant deleted, table corrected. |

**The list now stands at 24, and the record has been wrong about a completed item six sessions
running.** The pattern across all six found tonight is worth one sentence: *every one was a claim
about something being handled, written from one side of a boundary and never checked from the
other.* When the record says "X is handled", read the code that **consumes** X, not the code that
emits it.

---

## Verification

| | |
|---|---|
| Unit | **469/469** (450 → 469) |
| Harness | **50/50** (49 → 50) |
| Typecheck | **0 errors** |
| `next build` | **exit 0** |
| Cap, live room | 10 joiners → **8 PLAYER, 2 SPECTATOR, 0 rejected** |
| Cap, shipped bundle | `ENSEMBLE:8` present, **zero** `ENSEMBLE:6`, and none of the three old copy strings anywhere in the built JS |
| Drift guard | proved red by re-injecting `'1-6 Players'`, then restored |

Committed and pushed. **Deployed and verified — see the top of this file.**

---

## The queue

Full version in `NEEDS-JACKSON.md` (a copy sits beside this file).

1. **The line budget** — a number is recommended, not applied. Nothing else is blocked on it.
2. **Cutover step 6** — the cgroup re-verification on the running unit. Still blocking.
3. **Delete the Vercel project** — no token on this box.
4. `plottwists.com` — informational.
5. **Clerk production instance** — the live site is on the dev instance.
6. **Android signing-key fingerprint** — the one Chunk 5 step I could not do.
7. **CGNAT** — eventually, not urgent.
