# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Rewritten 2026-07-30 (third pass, after the line-budget decision). Machine labels: `[VPS]` = the
Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and said
so.

**Closed this pass by your decision:** the line budget (**42-52 / 3,000**) and the per-character
instruction, applied without waiting for the playtest as you asked. Acceptance met — median 6,
floor 4, zero invented characters. Detail in `HANDOFF.md` §14.

**Closed on the previous pass:** the seat cap. `MAX_PLAYERS.ENSEMBLE` is **8**. `HANDOFF.md` §13.

**Closed earlier today by your rulings:** Firestore (`DECISIONS.md` #7 — moot), copy voice (#10),
the install prompt (Option A), the `TermsContent` refund line, the public-domain settings.

**Closed by work:** Chunk 5, the rename (`HANDOFF.md` §12) — deployed and verified.

---

## 0. ✅ DEPLOYED 2026-07-30 19:18 UTC — the line budget and the cast fix are live

You approved 42-52 / 3,000 and ordered the per-character instruction applied without waiting for
the playtest. All of it is in, all of it passes your acceptance bar, and it is on plotslop.com.

`deploy.sh` took its abort path at the restart prompt again — stdin is not a TTY, `read` gets EOF,
and it correctly refuses to assume consent. I checked the window first (**zero** connections on
:3100, no persisted rooms) and completed the restart at 19:18:42.

| Check | Result |
|---|---|
| Service | active, **0 errors** in the journal since restart |
| apex / www / sang3r.com | 200 / 200 / 200 |
| Deployed band and ceiling | `standard: { min: 42, max: 52 }`, `standard: 3000` in `/srv/plotslop` |
| Deployed prompt | carries the closed cast list and both rules |
| All 14 HTTP routes this touches | every one responds — 3 OG cards `200 image/png`, replay/clips/digest/host/join 200, share cards 200 or a clean 404, **no 500s** |
| Live socket path | 9 sockets connected, room created, 8 seats joined, cards dealt |

### What I could NOT verify, and I am not going to pretend otherwise

**A real generation on the deployed server.** I wrote a smoke test that drives nine sockets into a
live room to force one, because "compiling is not responding" was this morning's lesson and the
whole change lives in the socket path. It got as far as the credit gate and stopped:

```
[WARN] Operation blocked: no hostUid for room Y42X
       → "Authentication required to generate scripts."
```

That is `server/socket/helpers.ts:99` working as designed — credits are tied to a Clerk user, so
**a host who is not signed in cannot generate a script in production.** Worth knowing before the
playtest: you must be signed in to host. It is not a defect and I did not change it.

So what I have instead, stated exactly: the deployed process **loaded** the new code (the import
chain `server.ts → handlers → game.handler → scriptGeneration.service → scriptCast.service` is
fully static, and the process booted clean and served a room), and the generation path itself ran
end-to-end against the **real API** four times on this box through the production `generateScript`,
plus through the full socket path with the mock in the harness. What is untested is that specific
combination — the deployed process making a real call. One signed-in round of yours closes it.

---

## 1. 🟠 The line budget and the cast fix — DONE, and the cost is higher than I told you

Your four asks, and where each landed:

| | | |
|---|---|---|
| 1 | Band 42-52, `max_tokens` 3,000 | ✅ applied |
| 2 | No speaker below 3 | ✅ applied — **measured floor is 4** |
| 3 | Exactly the seated cast, no invented characters | ✅ applied — **8/8/8 parts, zero invented** |
| 4 | Re-run three generations, report median/range/speakers | ✅ below |

### The measurement you asked for

| | before | after |
|---|---:|---:|
| lines per script | 37.7 | **51.3** |
| **median lines per seated player** | 0 | **6** |
| range | 0-0 | **4-12** |
| **distinct parts vs 8 seats** | 9 / 8 / 9 | **8 / 8 / 8** |
| mean per seated player | 0.00 | 6.42 |

**Your acceptance bar was median ≥ 5 and no speaker below 3. It is median 6, floor 4.**

### 🔴 Why the "before" column says 0.00 and not the 4.71 I gave you this morning

Because 4.71 was wrong, and the way it was wrong is the biggest thing in this session.

`MobileTeleprompter.tsx:99` decides whose phone says YOUR TURN:

```ts
const isMyTurn = currentLine.speaker === myCharacter
```

`myCharacter` is the **verbatim text of the trait card** the player picked. And the prompt was
handing the model a list of traits alongside an output format whose example read
`"speaker": "Character Name"` — so it invented first names. Marcus. Denise. Paulo.

**Zero of eight traits matched in any of three scripts.** Not usually, not mostly — zero, three
times out of three. Every part in every script this product has ever generated belonged to nobody,
and YOUR TURN has never once fired for any player.

My 4.71 divided script lines by seat count, which quietly assumed a speaker is a player. The
distribution *shape* I showed you was real and it produced the right recommendation. The number was
0.00.

Your instinct — *"at a full room that's a part nobody reads"* — was right about a ninth character
and it turned out to be true of **all** of them.

### What that forced

"Exactly the seated cast" is now enforced as *the speaker field literally is the trait string*.
The prompt hands over the cast list and demands it back character-for-character; a new
`scriptCast.service.ts` snaps near-misses and logs anything it cannot bind. **One of the three
re-runs needed 6 labels snapped** — the model varied punctuation on 6 lines — so the snapper is
load-bearing, not belt-and-braces.

SOLO is deliberately exempt: inventing its ensemble is the entire mode.

### The cost, and I got the forecast wrong

| | |
|---|---:|
| per round, before | $0.0400 |
| **per round, now** | **$0.0550** |
| I told you | ~$0.0437 (+15%) |
| Actual | **+37.5%** |

Neither cause is the line budget. The cast list adds ~500 input tokens, and a ~50-character
speaker label on every line adds ~7 output tokens per line. **I forecast the change I was
recommending and not the change I was about to make.** $9 buys **~164 rounds** instead of ~225.

If that trade is not worth it to you, the lever is the label: short names would cost less and
would break the binding again. I would keep the binding.

### On quality — you asked to be told plainly

**The scenes did not get stiff, and they did not get evenly boring.** Line length held (6.29
words/line, longest 14 — no essay drift), the traits drive the voices harder than before, and the
lead survived: busiest seats took 12, 10 and 9 lines against a floor of 4. The prompt says the
floor is a floor and says explicitly that it is *not* an instruction to divide lines evenly,
because that was the failure mode you named.

Read script 3 in the packet ("Say Cheese and Nothing Else"). *Interprets all silence as agreement*
gets a line that is just `...` followed by `Unanimous. We're staying.` That joke only exists
because the trait is the character.

**One visible cost, not fixed, because it is your call:** speaker labels on the teleprompter are
now sentences rather than names. `MobileTeleprompter.tsx:226` renders them at 13px uppercase mono,
centred — a 50-character trait wraps to two or three lines above every line of dialogue. Legible,
and uglier than it was. Say the word and I will design a shorter display form that keeps the
binding.

---

## 2. 🔴 Cutover step 6 — unchanged, still yours, still blocking

The five-box cgroup re-verification on the *running* unit. Every isolation measurement so far was
taken on a transient `systemd-run` unit; that proves the directives work, not that **this** unit
gets them. Commands and pass/fail per box: `SESSION-2026-07-29-EVENING.md` §7b; the checklist also
prints from `cutover.sh`.

⚠️ A deliberate OOM test spends `StartLimitBurst`. Finish with `systemctl reset-failed plotslop`,
or the next start refuses and hands you a **stale** error.

---

## 3. 🟢 Nothing needed — the OG fix I reported earlier today was half a fix, twice over

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

Fixed and deployed. **And it turned out to be the smaller of two bugs in that file** — see §0: the route was throwing two lines above the fetch, so this had never been reached there at all.

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

**The line budget and the cast fix, in full.** The band and ceiling; a closed cast list in the
prompt with a 3-line floor stated as a floor rather than a ration; a new `scriptCast.service.ts`
that snaps speaker labels onto the seated cast and logs what it cannot bind; both branches of
`generateScript` now reading the length table instead of restating it; the playtest packet's
distribution section rewritten to attribute against the cast list. 48 new unit tests — the suite
is **517/517**, up from 469, and nothing had asserted the line budget or the binding before.

**Three more corrections to the record**, `HANDOFF.md` §9 #25-27:

- **#25** — the 4.71 I gave you this morning was 0.00. The metric divided by a denominator it never
  checked the numerator against.
- **#26** — the playtest packet *praised* the bug in prose, calling invented speaker names "the
  grammar doing what it was supposed to do", in the artefact you were meant to read before a
  playtest.
- **#27** — my +15% cost forecast came in at +37.5%, because I modelled the change I was
  recommending and not the change I was about to make.

That list now stands at **twenty-seven**, and the record has been wrong about a completed item
**seven sessions running**. Assume it will be again.

The pattern in these three is one step past yesterday's. Those were claims checked from the wrong
side of a boundary. These are three places where the instrument, the artefact and the forecast all
**agreed with each other and were wrong together**, because they shared a premise none of them
tested — that a `speaker` string means a person. Agreement between your own instruments is not
corroboration when they share an assumption.

Verification after everything: **517/517 unit · 50/50 harness · tsc 0 errors · `next build` exit 0
· 14 live routes curled, no 500s · 4 real API generations**. And one thing deliberately left
unverified and named as such in §0, rather than rounded up to "done".
