# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Rewritten 2026-07-30. Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and said
so. The 2026-07-29 queue is in git history; every item on it is either closed below or carried
forward here with a new number.

**Closed by your rulings this session:** Firestore (`DECISIONS.md` #7 — moot, no project), copy
voice (#10 — applied), the install prompt (Option A — applied), the `TermsContent` refund line
(applied, and it turned out to be four wrong Apple/iOS claims rather than one), the public-domain
settings (my call — kept; reasoning recorded in `scripts/build-catalog.ts` so it is not
re-litigated a fourth time).

**Closed by work:** Chunk 5, the rename, complete — `HANDOFF.md` §12.

---

## 1. 🔴 Deploy. Everything from today is invisible until you do.

**New, and now the top item.** Chunk 5 is committed and verified — 450/450, 49/49, tsc clean,
`next build` exit 0 — but **`plotslop.com` still serves the pre-rename build.** Right now, live,
the site:

- titles itself **"Plot Twists"**;
- tells every host to send players to **`plottwists.com/join`** — a domain that resolves to
  `156.254.10.135`, **somebody else's server** (item 6);
- emits `og:image="http://localhost:3000/opengraph-image"`, so every shared link preview is broken;
- serves a `robots.txt` and `sitemap.xml` full of `http://localhost:3000` URLs.

All four are fixed in the repo and verified against a real production build.

**Why I did not deploy.** CONSTRAINT-1: game state is process-local, so a restart ends every game
in flight. You wrote that this stopped being a pipe-`y` decision the moment the service went live.
One command when you want it:

```
[VPS] sudo bash scripts/deploy.sh          # it prompts before the restart — answer it yourself
```

Weekday daytime, never Friday–Sunday evening.

**One correction to carry in with you.** The previous version of this file said the OG fix was "one
line in `/etc/plotslop/env` plus a restart". That was wrong twice: `NEXT_PUBLIC_*` values are baked
in at **build** time, and the fallback chain never reached the dead domain anyway — it stopped at a
`localhost:3000` default hidden in `next.config.js`. `HANDOFF.md` §9 #14. **You no longer need to
set anything**; the build now produces `https://plotslop.com` with the variable unset.

---

## 2. 🔴 The seat cap — the scope freeze gates on a number the game cannot seat

**You asked for the blast radius before the change. Here it is. I have not touched the cap.**

Your freeze lifts when you have *"played this with eight people who are not my friends."*
`MAX_PLAYERS.ENSEMBLE` is **6**. Confirmed two ways — reading every reader of the constant, and
driving eight real clients through a live ENSEMBLE round and reading the prompt the model got:

```
8 joiners → 6 PLAYER, 2 SPECTATOR, 0 rejected      (9 in the room, counting the host)
CRITICAL: You have 6 characters...                 (what actually reached the model)
```

Nobody is turned away — joiners 7 and 8 become **spectators**, and the trait list is built from
PLAYER-role selections only. So eight people can be in the room; six can be in the scene. The host
holds a `HOST` role rather than a player seat, so they neither consume a seat nor add a trait.

**The live UI already claims 8.** `HostLobby.tsx:338` renders `Max 8` for ENSEMBLE while the mode
card *on the same screen* says *"3-6 performers"*. It is in the deployed bundle today. So the
playtest failure mode is concrete: you read "Max 8", invite eight, and two of them end up
spectating.

**I left it broken deliberately** — which of those two numbers is wrong *is* this decision, and
fixing either one pre-empts you.

**What raising it to 8 would touch — less than you'd expect:**

| | |
|---|---|
| `AUTO_START_THRESHOLD` | **Untouched.** `ENSEMBLE: 3` is a minimum, not a maximum. |
| The prompt's line budget | **Untouched.** 30-38 is a constant, not a function of cast size. |
| The 2,600 `max_tokens` ceiling | **Untouched.** Also constant — the one player-coupled multiplier was already removed on 2026-07-29. |
| Card dealing, voting, results, progression | **Untouched.** Dealing is per-room; the rest iterate the player map. |
| Tests | **Nothing asserts the cap.** Which is its own small problem: raising it would turn nothing red. |
| **The UI** | **Three hardcoded numbers**, all strings: `HostLobby.tsx:338` (`Max 8`), `HostLobby.tsx:504` (`3-6 performers`), `opengraph-image.tsx:34` (`?? 8`). The cast list itself is wrapping chips and reflows at any count. |
| **The playtest artefacts** | **The real cost.** Both need regenerating at whatever you pick — item 3. |

**My recommendation, and why it is not a slam dunk.** Mechanically, 8 is nearly free. But your
stated reasoning for the 30-38 line cap was *"eight people performing seventy lines is where a
party stops being fun"* — you were already thinking in eights. At 8 performers across 38 lines each
player averages under five lines, and the failure mode flips from "too long" to "standing around".
At 6 it is about six lines each. **If eight is load-bearing because it is your playtest, raise the
cap. If six is the better scene, change the freeze wording instead.** Same decision from opposite
ends; only you can pick.

Either way the durable fix is to derive all three UI strings from `MAX_PLAYERS` so they cannot
drift apart again. I will do that with your answer, not before.

---

## 3. 🟠 Both playtest artefacts were measured at 8 traits. You were right.

You asked whether the three scripts and the `$0.053` were generated with 8. **They were** —
`scripts/real-generation.ts:54` sets `PLAYERS = 8`, and the output confirms it independently: all
three scripts list 8 traits and produced 8, 10 and 8 distinct speaking parts.

**They do not fail the same way, so they do not need the same fix:**

- **The three scripts: invalid as a preview, and they need a real re-run.** An 8-part scene at a
  fixed 30-38 lines is a denser cast with fewer lines each — a different artefact from what a real
  room can produce. I have **not** re-run them: a real run costs money and the right cast size is
  item 2, which is yours. Once you have decided:
  `[VPS] sudo npx tsx scripts/real-generation.ts` (needs root — it reads the key from
  `/etc/plotslop/env`), then `npx tsx scripts/playtest-packet.ts > PLAYTEST-2026-07-29.md`.
- **The cost figure survives the cast-size problem — but the packet was stale for an unrelated
  reason, and I fixed that.** Cast size barely moves cost: the line budget and `max_tokens` are
  constants, so two fewer traits change the prompt by about 1%. **But the committed packet predated
  its own data** — the `.md` was written at 18:23 and the generation ran at 19:05, so it was
  reporting pre-length-cap numbers:

| | packet said | actually |
|---|---:|---:|
| script lines | 59–73 | 38, 38, 38 |
| **cost per round** | **$0.0531** | **$0.0407** |
| $9 buys | ~169 rounds | **~221 rounds ≈ 36 evenings** |

  Regenerated from the existing data, so the cost table is now right and carries a banner marking
  the scripts above it as an 8-cast artefact. **Your budget is 23% better than the packet claimed.**

---

## 4. 🔴 Cutover step 6 — unchanged, still yours, still blocking

The five-box cgroup re-verification on the *running* unit. Every isolation measurement so far was
taken on a transient `systemd-run` unit; that proves the directives work, not that **this** unit
gets them. Commands and pass/fail per box: `SESSION-2026-07-29-EVENING.md` §7b; the checklist also
prints from `cutover.sh`.

⚠️ A deliberate OOM test spends `StartLimitBurst`. Finish with `systemctl reset-failed plotslop`,
or the next start refuses and hands you a **stale** error.

---

## 5. 🟠 Delete the Vercel project

Link check clean, nothing references it, and it **cannot serve this product** — `npm start` is
`tsx server.ts`, a custom Socket.IO server that Vercel's Next preset never runs.

I narrowed `server.ts`'s preview-origin trust to `plotslop*.vercel.app` (the `plot-twists`
alternative went with the rename), but **that trust should not outlive the project**: while it
exists, any preview deploy under that name is an origin the live game server accepts.

Blocked the same way as before — no Vercel token on this box, CLI not installed, no
`.vercel/project.json`, and the `gh` token carries only `gist, read:org, repo`. Vercel → the
project → Settings → Delete Project.

---

## 6. 🟠 `plottwists.com` belongs to someone else, and the site was pointing players at it

Not a question — something you should know, because it was in no inventory.

The rename tables tracked `plot-twists.com`. The code also contained **`plottwists.com`**,
**`plottwists.app`** and **`plottwists.live`**. The last two have no DNS. The first one resolves:

```
plottwists.com  →  156.254.10.135
```

And it was the **join instruction on the host's lobby screen** — *"plottwists.com/join → CODE"* —
plus a second copy under the QR block. At a party that is the sentence people read and type. All
three now resolve through `lib/siteUrl.ts` and ship with item 1.

Nothing to do unless you once owned `plottwists.com` and want it back.

---

## 7. 🟡 A Clerk *production* instance for plotslop.com

Unchanged. The live site runs on the **dev** instance `alive-jawfish-19.clerk.accounts.dev` — fine
for playtesting, not for launch. The `pk_live` you nearly sent was bound to
`clerk.plot-twists.com`, the dead domain.

---

## 8. 🟡 The Android signing-key fingerprint — Chunk 5 step 4, the one step I could not do

`public/.well-known/assetlinks.json` still reads
`"sha256_cert_fingerprints": ["TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT"]`. Android deep
links have never worked and still do not. It needs the fingerprint of your Android signing key
(`keytool -list -v -keystore <your.keystore>`). Everything else in that file is now correct.

Low stakes while the game is web-only.

---

## 9. 🟡 Carrier-grade NAT, eventually

Unchanged, not urgent. Rate limiters are keyed on client IP, which fixed a real bypass but puts
thousands of unrelated mobile subscribers in one bucket. It cannot bite at playtest volume. At
scale it presents as *"the game is broken on mobile data"*, not as a rate limit. Both limits are
env knobs (`ROOM_CREATE_MAX`, `ROOM_CREATE_WINDOW_MS`, `MAX_LIVE_ROOMS_PER_CREATOR`) and signed-in
hosts are already immune. The durable fix — requiring an account to create a room — is a product
decision and it is yours.

---

## Not waiting on you

Chunk 5 shipped in full (`HANDOFF.md` §12): 103 brand occurrences across 45 files, the copy pass in
the voice you chose, four dead domains consolidated behind one constant, CORS and the Vercel regex
cleaned, the legal pages corrected, the install prompt suppressed per Option A, the Capacitor
`webcredentials:` entitlement moved off the expiring domain, and the service-worker cache bumped so
installed PWAs actually evict the old shell.

Six more corrections to the written record are in `HANDOFF.md` §9 — that list is now eighteen, and
the record has been wrong about a completed item **five sessions running**. The two worth your
attention are **#14** (the OG diagnosis in the previous version of *this file* was wrong, and so was
the fix it prescribed) and **#16** (the playtest packet predated its own data).

Verification after everything: **450/450 unit · 49/49 harness · tsc 0 errors · `next build` exit 0.**
