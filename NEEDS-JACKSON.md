# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Rewritten 2026-07-30 (second pass, after the seat-cap decision). Machine labels: `[VPS]` = the
Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and said
so.

**Closed this pass by your decision:** the seat cap. `MAX_PLAYERS.ENSEMBLE` is **8**, all four
follow-on items are done, and the playtest artefacts have been re-run at 8. Detail in
`HANDOFF.md` §13.

**Closed earlier today by your rulings:** Firestore (`DECISIONS.md` #7 — moot), copy voice (#10),
the install prompt (Option A), the `TermsContent` refund line, the public-domain settings.

**Closed by work:** Chunk 5, the rename (`HANDOFF.md` §12) — deployed and verified.

---

## 0. ⚠️ There is an undeployed build. The live site does not have any of today's second pass.

`plotslop.com` is still serving the **17:25 UTC** build. Everything below the line — the seat cap
of 8, the derived UI copy, the Audience group in the host lobby, and the four localhost fetches in
item 3 — is committed and built but **not live**.

```
[VPS] sudo bash scripts/deploy.sh
```

I did not run it. Restarting ends every game in flight (CONSTRAINT-1), and the script's restart
prompt is deliberately the one step I leave to you — it is also why the last deploy took its abort
path when I invoked it non-interactively. There were **zero live socket connections** when I
checked at 18:4x UTC, so the window is currently free.

Gates before you run it: **469/469 unit · 50/50 harness · tsc 0 errors · `next build` exit 0.**

---

## 1. 🟠 The line budget — your rule fired, and here is the number you asked for

You said: *"average speaking lines per player at 8. If it's under 5, the fix is raising the 30-38
line budget, NOT lowering the cap back. Recommend a number, don't apply it."*

**It is 4.71. Under 5.** Measured from three fresh live-API generations at 8 traits
(`PLAYTEST-2026-07-30.md` → *How much each player actually says*).

**But the mean is the flattering number, and that is the finding.**

| | |
|---|---|
| Mean per seated player | **4.71** |
| **Median across every speaker** | **3.5** |
| Range | **2 - 12** |
| Distinct speakers the model wrote | **9, 8, 9** — against 8 traits |

The model does not divide the budget evenly. One character took **11 of 38** lines in one script
and **12 of 38** in another; three speakers got **2**. And two of the three scripts invented a
**ninth** character, whose lines still have to be read by somebody in the room. So the realistic
experience at 8 is not "everyone gets 4.7" — it is one person carrying the scene while two or three
people hold two lines each and wait.

### My recommendation: **42-52, and raise `max_tokens` to 3,000.**

Not 30-38 scaled by 8/6. The reasoning:

| | |
|---|---|
| **Why the range widens rather than shifts** | A fixed narrow band is what forces the model to pay for a ninth character by starving three others. Giving it 10 lines of slack lets it seat everyone without cutting the busiest part. |
| **52 lines ≈ 6.5 per seat, median ~5** | That puts the *median* above your threshold, not just the mean. Aiming the mean at 5 leaves half the room below it. |
| **`max_tokens` 2,600 → 3,000** | Measured output is **39 tokens/line**. 52 lines ≈ 2,030 tokens — 78% of the current ceiling, which is too close for a model that occasionally writes long. 3,000 gives ~14% headroom and is still nowhere near a runaway. |
| **Runtime cost: about 40 seconds** | A 38-line script is **1.8 minutes** of reading at 120 wpm (5.8 words/line, measured). At 52 lines it is **2.5 minutes**. Your "seventy lines is where a party stops being fun" line was about ~3.4 minutes; 52 is comfortably inside it. |
| **Money cost: about 15%** | $0.0400 → **~$0.0437** per round. $9 buys ~206 rounds instead of ~225. |

**The honest caveat:** raising the budget raises the floor, it does not fix the skew. If after a
playtest the complaint is *"one person did all the talking"* rather than *"I didn't get to say
much"*, the fix is in the prompt — an explicit per-character line-share instruction — not in the
budget. I would rather you find that out with eight real people than have me guess at it now.

**Not applied.** You asked for a number.

---

## 2. 🔴 Cutover step 6 — unchanged, still yours, still blocking

The five-box cgroup re-verification on the *running* unit. Every isolation measurement so far was
taken on a transient `systemd-run` unit; that proves the directives work, not that **this** unit
gets them. Commands and pass/fail per box: `SESSION-2026-07-29-EVENING.md` §7b; the checklist also
prints from `cutover.sh`.

⚠️ A deliberate OOM test spends `StartLimitBurst`. Finish with `systemctl reset-failed plotslop`,
or the next start refuses and hands you a **stale** error.

---

## 3. 🟢 Nothing needed — but you should know the OG fix I reported yesterday was half a fix

Not a question. It is the correction I would most want to read if I were you, and it is mine.

I told you *"the localhost OG bug is dead"* and gave you a verification table. That check was real,
and it covered `/opengraph-image` — **the one image route that does not fetch anything.** Four
sibling routes did, including **the invite-link card, which is the entire join path**. Each had its
own `NEXT_PUBLIC_WS_URL || 'http://localhost:3000'`, and that variable is not set, and
`NEXT_PUBLIC_*` is baked in at build time.

Port 3000 on this box is **sang3r.com**. Confirmed two ways — `PORT=3100` in the unit's
environment, and `curl localhost:3000` returning `<title>Jackson Sanger</title>`. So every one of
those four fetches has been hitting your personal site, 404ing, and falling back to a generic card.
It failed *quietly*, which is why nothing caught it.

Two of the four files **already imported** the site-URL constant — the rename sweep opened them,
fixed the domain they *displayed*, and left the domain they *fetched*. A grep for dead brand names
does not match "localhost".

Fixed, tested, built. Ships with item 0.

---

## 4. 🟠 Delete the Vercel project

Link check clean, nothing references it, and it **cannot serve this product** — `npm start` is
`tsx server.ts`, a custom Socket.IO server that Vercel's Next preset never runs.

I narrowed `server.ts`'s preview-origin trust to `plotslop*.vercel.app`, but **that trust should
not outlive the project**: while it exists, any preview deploy under that name is an origin the
live game server accepts.

Blocked the same way as before — no Vercel token on this box, CLI not installed, no
`.vercel/project.json`, and the `gh` token carries only `gist, read:org, repo`. Vercel → the
project → Settings → Delete Project.

---

## 5. 🟠 `plottwists.com` belongs to someone else — informational, carried forward

The rename tables tracked `plot-twists.com`. The code also contained **`plottwists.com`**,
**`plottwists.app`** and **`plottwists.live`**. The last two have no DNS. The first resolves to
`156.254.10.135`, and it was the **join instruction on the host's lobby screen**. All three now
resolve through `lib/siteUrl.ts` and shipped on 2026-07-30.

Nothing to do unless you once owned `plottwists.com` and want it back.

---

## 6. 🟡 A Clerk *production* instance for plotslop.com

Unchanged. The live site runs on the **dev** instance `alive-jawfish-19.clerk.accounts.dev` — fine
for playtesting, not for launch. The `pk_live` you nearly sent was bound to
`clerk.plot-twists.com`, the dead domain.

---

## 7. 🟡 The Android signing-key fingerprint — Chunk 5 step 4, the one step I could not do

`public/.well-known/assetlinks.json` still reads
`"sha256_cert_fingerprints": ["TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT"]`. Android deep
links have never worked and still do not. It needs the fingerprint of your Android signing key
(`keytool -list -v -keystore <your.keystore>`). Everything else in that file is correct.

Low stakes while the game is web-only.

---

## 8. 🟡 Carrier-grade NAT, eventually

Unchanged, not urgent. Rate limiters are keyed on client IP, which fixed a real bypass but puts
thousands of unrelated mobile subscribers in one bucket. It cannot bite at playtest volume. At
scale it presents as *"the game is broken on mobile data"*, not as a rate limit. Both limits are
env knobs (`ROOM_CREATE_MAX`, `ROOM_CREATE_WINDOW_MS`, `MAX_LIVE_ROOMS_PER_CREATOR`) and signed-in
hosts are already immune. The durable fix — requiring an account to create a room — is a product
decision and it is yours.

---

## Not waiting on you

**The seat cap, in full.** 8 seats, twelve hardcoded counts replaced with derivations across nine
files, a new `lib/playerCounts.ts`, a spectator **Audience** group on the host's lobby, 19 new unit
tests including a drift guard that reads real UI source, and two false greens in the harness turned
into real assertions. `HANDOFF.md` §13.

**Five more corrections to the record**, §9 #19-23 — the OG one above, a `https://localhost:3000`
baked into the SSR bundle, the blast-radius undercount, and "silent demotion", which was asserted
in two places and was false in both: the *joiner* has always been told; the *host* was not.

That list now stands at **twenty-three**, and the record has been wrong about a completed item **six
sessions running**. The pattern across the five found today is worth one sentence: every one was a
claim about something being handled, written from one side of a boundary and never checked from the
other. When the record says "X is handled", read the code that *consumes* X, not the code that
emits it.

Verification after everything: **469/469 unit · 50/50 harness · tsc 0 errors · `next build` exit 0.**
