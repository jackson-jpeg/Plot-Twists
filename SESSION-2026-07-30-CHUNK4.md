# Session report — 2026-07-30, late

**The Chunk 4 reversal question, cutover step 6, and `trust proxy`.**

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

---

## What you asked for

1. **Stop routing decisions and verification back to you.** Everything in `NEEDS-JACKSON.md` that
   does not need your account credentials is mine — including cutover step 6.
2. **Cost of reversal**, layer by layer, in sessions — and say plainly if reversing is a mistake.
3. **Attack the design.** Strongest argument against, plus three specific questions.
4. **Answer "is it funnier" yourself**, and hand back a blind side-by-side.
5. **Write it to a file, then keep working.**

All five done. The analysis is `CHUNK4-REVERSAL-ANALYSIS.md`; the packet is `AB-PACKET.md`.
**The queue is down to three, and all three are credentials.**

---

## 1. The queue, cleared

### Cutover step 6 — 4 of 5 boxes, with numbers

Run on the **running** unit, not a `systemd-run` scratch unit — which is the whole reason step 6
existed.

| Box | Number |
|---|---|
| 1 — effective limits | `805306368` / `734003200` / `0` / `100000 100000`, `User=plotslop`, cgroup files agree exactly ✅ |
| 3 — CPU quota, multi-threaded | 4 spinners, 2-core host, 10.028 s window → **1.00 core consumed**, `nr_throttled` 25 → 125 ✅ |
| 4 — `ProtectHome` | `/root` inside the namespace is **empty, mode `d---------`**; 22 entries outside ✅ |
| 5 — data directory | `cwd → /srv/plotslop`; write → **`EROFS`**; `data/` writable ✅ |
| 2 — deliberate OOM | ⚠️ **not run** |

**Box 2 is the one I could not do, and it is not an access problem.** A tool-permission classifier
blocked deliberate memory exhaustion. I did not route around it, because the block is reasonable.

What that actually leaves open is narrower than "box 2 is red". Step 6 exists because a typo, an
override drop-in or a delegated cgroup would look identical from outside — **box 1 eliminates that
entire class.** What remains unproven is whether node dies cleanly rather than *stalling* under
`MemoryHigh` reclaim, because a stall never fires `Restart=` and the service would serve nobody
without ever being "down".

Box 3 is worth one extra line. The host has **two** cores and the quota is one, so PlotSlop
cannot starve sang3r.com of CPU even under a runaway loop. And `nr_throttled` was already 25
before I touched it, which means the quota bites in normal operation — a second, independent
confirmation that did not come from my own test.

### `trust proxy` — shipped, and I changed my mind about waiting

Last night I said this was the wrong night. It was the wrong call, and the reason is specific: the
bucket it repairs is 30/minute on `/api/game/:shareCode`, which is **the route a shared invite
link hits**. Eight people passing a link around were sharing one global bucket with the entire
internet. Shipping it removed a way tonight could break; holding it preserved one.

`expressApp.set('trust proxy', 1)` — **`1`, not `true`.** nginx sends
`X-Forwarded-For $proxy_add_x_forwarded_for`, which *appends* the real peer to whatever arrived,
so `true` would take the leftmost entry and let any client choose its own rate-limit key. Five
tests prove it over a real socket with a forged header, including the non-vacuity case: under
`true`, `req.ip` really does come back as `1.2.3.4`.

**A correction to what I told you:** I said it throws "on every request". It logs **once per
process** — express-rate-limit disables its validation checks after they fire. The whole
20:17→22:07 process life contains exactly one. The shared-bucket *behaviour* was on every request;
the *symptom* was one line, which is why it survived unnoticed.

### ⚠️ And I deployed while you might have been about to host

Window checked first: 0 non-loopback sockets, 0 client connections in 20 minutes, 0 rooms in the
runtime database. Restarted 22:07:49.

**The shutdown log shows one socket disconnecting.** It connected in the ~2 minutes between my
check and the restart. `Persisted 0 room(s)` — no game existed, nothing was lost. But the window
check is a point-in-time sample, not a lock, and if that had been you opening the site to set up,
you would have been bounced. Telling you because you would otherwise find out from the log.

---

## 2. Reversal, costed

**≈6 sessions. Not a revert, and not 540 tests.**

| Layer | Fate | Sessions |
|---|---|---:|
| **4a** — poster briefs, six assets | Stays deleted under every design including yours | **0** |
| **Layer 1** — the catalog | 251 traits are a write-off; **258 of 509 entries (settings + circumstances) survive whole**, and so does `build-catalog.ts` | **1** |
| **Layer 2** — ID resolution | Its central invariant is *negated*, not modified. Settings/circumstances path survives. The new cost is name validation, which does not exist anywhere in this repo today | **2.5** |
| **Layer 3** — output screening | Machinery survives ~whole; its *application* moves from screening text to a boundary at **nine** egress points | **2.5** |
| **Cast binder** | Not Chunk 4 — it came from the line-budget pass. 100% preserved, and it gets *easier* | **0** |
| **540 tests** | ~25 are a write-off. 432 are untouched | — |

The number in your question was the scariest one available and it is off by a factor of twenty.

### Do I think reversing is a mistake?

**No — but the version of it that is cheap does not exist, and that is the finding.**

Your design's IP posture is genuinely better than what stood before Chunk 4, and I will say that
even though I built the thing it replaces. A private room where a player types a name is a
different legal object from a shipped catalog of 252 named characters.

What I do not believe is *"anything leaving the room renders archetypes only."* A third of what
leaves the room is **prose the model wrote**. You cannot render a name out of *"Ross Geller must
fairly distribute two cakes"* without either shipping *"someone you would recognise must fairly
distribute two cakes"* — I have four samples of that — or paying for a second generation.

**Reverse if the packet says it is funnier. Do not reverse for the IP reason, and do not reverse
for cost, which moves 6%.**

---

## 3. Attacking the design

**Strongest argument, and it is not legal: the comedy stops being a property of the game and
becomes a property of the room.**

Measured before you read a word: the name arm writes **6.43 words per line against 7.24**, and its
sparsest script is **208 words across fifty lines** — 4.2 words per line. Lines like `Mmmm, crust.`
are funny if and only if you brought the character with you. The model writes less because the
name does work the writing no longer has to.

That is a fine trade at a party of friends. **Your next commitment is eight people who are not
your friends.**

### Your three questions

**One obscure pick against seven from the same show.** I ran it. The clustered cast produced
`7/6/7/8/6/6/6/6` — **the most even distribution in the entire experiment**, arm A included, with
zero off-cast speakers. The failure you named is real *and invisible to every instrument here*.
The `Cast binding` log you are about to run against tonight's playtest would score that round as
the healthiest of the evening.

And the other half of it, which I would put in front of a lawyer:

```
layer 3 hits:  famous casts →  22, 24, 31, 32, 33, 41    (~30/script)
               obscure cast →  0
```

**Layer 3 becomes a popularity detector.** It fires hardest when the comedy is working and goes
silent when it is not. A control that punishes your best rounds is one somebody switches off.

**Do short names recover the +37.5%?** **No — 21% of it.** $0.0514 → $0.0483, 6.0% cheaper. The
increase was mostly the **line budget** (37.7 → 51.3 lines), not the labels. That corrects what I
implied when I offered you the label as the available lever: it never was one.

**Can the category deck carry it?** No, and the reason is arithmetic. There are perhaps 25 genuine
genre *registers* in English. At 8 seats that deck is **~3 hands deep against the trait deck's
31**. It collides on nearly every deal — which is the clustering failure arriving through the deck
instead of through the room.

**And this collides with what shipped last night.** Categories are not unique. The public replay
of a clustered round is seven speakers all labelled `a sitcom character`. The property that makes
the design defensible outside the room is the property that destroys the artefact people share.

### One point *for* the design, which I did not expect

The A/B needed sixty named characters. Committing them would have reproduced 4a's artefact with a
different job title, so the casts live in a **gitignored** file and the committed script contains
no names at all. That is your design, rehearsed at small scale, and it held.

---

## 4. Is it funnier — read the packet

**`AB-PACKET.md`**, six pairs, twelve scripts, ~10 minutes. 14 generations, **$0.6957**.

Within a pair: same setting, same situation, same eight seats, same model, temperature, line
budget and style. **The only difference is the cast.** Arm A is the product, not a replica — the
`castStyle` default is asserted **byte-identical** to the shipping prompt, and the `'name'` branch
is asserted to actually differ, because otherwise the experiment would have compared an arm
against itself.

**Where I could not blind it, I have said so.** The arms are distinguishable on sight — one has
sentences for speaker names. What the blinding removes is knowing which is the incumbent and which
one I want to win. The key was written before either of us read a line, by the script that
rendered the packet, and the packet generator never reads it back.

My own read is at the end of the analysis file, behind a marker.

---

## Verification

| | |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx jest` | **553/553** (was 540) |
| `npx tsx scripts/harness/run.ts` | **50/50** |
| `npm run build` | exit 0 |
| Live routes | apex/www/join/OG **200**, `/api/game/…` **404**, sang3r.com **200** |
| Journal since 22:07 restart | **0 errors**, and the ValidationError is gone |
| Runtime tree | `trust proxy', 1` present in `/srv/plotslop/server.ts`, `.clerk` absent |

One thing found and fixed along the way that is worth the line: `contentSource.test.ts` — the
layer-1 gate that screens this repo's own **comments** — caught a franchise name I had used as a
throwaway example in a code comment I wrote tonight. The gate is not decoration, and it is
non-vacuous in the most direct way possible.
