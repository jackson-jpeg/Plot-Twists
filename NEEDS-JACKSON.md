# NEEDS-JACKSON

**The single queue.** Rewritten 2026-07-30 (fifth pass) under your new operating rule: nothing
sits here because I would prefer a human ruling. Machine labels: `[VPS]` = the Linux box,
`[MACBOOK]` = your Mac.

**The queue is three items.** You named three — Vercel, Clerk production, the Android
fingerprint — and after working through the rest, three is what is left. Everything else that was
here is either done and reported below, or was never yours.

---

## THE THREE THAT ARE ACTUALLY YOURS

Each one is here because it needs a credential I do not have, and I have said which.

### 1. 🟠 Delete the Vercel project

**Why it needs you specifically:** there is no Vercel token on this box, the CLI is not installed,
there is no `.vercel/project.json`, and the `gh` token carries only `gist, read:org, repo`. There
is no path from this machine to your Vercel account.

Vercel → the project → Settings → Delete Project.

It cannot serve this product — `npm start` is `tsx server.ts`, a custom Socket.IO server that
Vercel's Next preset never runs. The reason it still matters: `server.ts` trusts
`plotslop*.vercel.app` as a CORS origin, and **that trust should not outlive the project.** While
it exists, any preview deploy under that name is an origin the live game server accepts.

### 2. 🟡 A Clerk *production* instance for plotslop.com

**Why it needs you specifically:** creating a production instance is an account-level action in
your Clerk dashboard, and the resulting `sk_live` is a secret only you can mint.

The live site runs on the **dev** instance `alive-jawfish-19.clerk.accounts.dev` — fine for
playtesting, not for launch. The `pk_live` you nearly sent was bound to `clerk.plot-twists.com`,
the dead domain.

Not blocking tonight. Blocking the first time a stranger who is not at your party signs in.

### 3. 🟡 The Android signing-key fingerprint

**Why it needs you specifically:** it is the SHA-256 of a keystore that exists only on your
machine, and there is no copy of it here — which is correct.

`public/.well-known/assetlinks.json` still reads
`"sha256_cert_fingerprints": ["TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT"]`.

```
[MACBOOK] keytool -list -v -keystore <your.keystore> | grep SHA256
```

Paste me the line and I will land it. Android deep links have never worked and still do not; low
stakes while the game is web-only.

---

## ⭐ STILL TRUE FOR TONIGHT — the watch-list

Unchanged from the last pass except where noted. Most important first.

1. **Sign in before you create the room.** Credits are tied to a Clerk user
   (`server/socket/helpers.ts:99`), so an anonymous host cannot generate a script at all. Still
   the single most likely way the evening stops dead in the first two minutes.
2. **Does YOUR TURN actually fire?** Never verified end to end. Tonight is the only way.
3. **Does anyone get a cue that is not theirs?** That would be a label collision. Guarded and
   tested, but a real room is the first time eight arbitrary cards have been in play together.
4. **Watch for a part nobody claims** — a speaker label nobody recognises means the model invented
   a character. The server logs it.
5. **~~Do not let me deploy while you are playing.~~** ⚠️ **I deployed at 22:07 UTC.** Read the
   note below before you start — it is done, it is verified, and the window was checked, but you
   should know it happened rather than find out.
6. **Audience plot twists fall back to templates silently** if you switch them on
   (`audience.service.ts:579`). Parked feature, unverified against the live model. The failure
   looks like "boring", not "broken".

### Afterwards, this turns the playtest into a measurement

```
[VPS] journalctl -u plotslop --since "1 hour ago" | grep -E "Cast binding|not seated|no lines at all|below the 3-line"
```

Send me the output. **One caveat I learned today and did not know when I first gave you this
command:** a cast where seven people picked from the same show produces the *healthiest-looking*
line in this log of anything I generated. This measures whether everyone got lines. It cannot
measure whether everyone was in the same scene.

---

## DONE SINCE THE LAST PASS — no action, reported because you asked for numbers

### ✅ Cutover step 6 — four of five boxes run and passed, on the running unit

| Box | |
|---|---|
| **1 — effective limits** | ✅ `MemoryMax=805306368` · `MemoryHigh=734003200` · `MemorySwapMax=0` · `CPUQuotaPerSecUSec=1s` · `TasksMax=256` · `User=plotslop`, and the cgroup files agree **exactly**. `memory.events` all zero. |
| **3 — CPU quota** | ✅ Four spinners inside the service's own cgroup on a **2-core** host. Over a 10.028 s window it consumed **10,037,240 µs — 1.00 core**, not 2.00. `nr_throttled` 25 → 125. Both counters were already non-zero beforehand, so the quota bites in normal operation too. |
| **4 — `ProtectHome`** | ✅ `/root` from inside the namespace is an **empty directory, mode `d---------`**; from outside it has 22 entries. Invisible, not merely unreadable. |
| **5 — data directory** | ✅ `cwd → /srv/plotslop`; `touch /srv/plotslop/nope` → **`EROFS`**; `data/` writable. |

**Box 2 (deliberate OOM) is the one I could not run, and the reason is not access.** It was
blocked by a tool-permission classifier on deliberate memory exhaustion. I did not work around it,
because the block is a reasonable one.

**What that leaves open, precisely.** Step 6 existed because every previous measurement was taken
on a transient `systemd-run` unit — a typo, an override drop-in or a delegated cgroup would look
identical from outside. **Box 1 eliminates that entire class**: the real cgroup carries the real
numbers. What is still unproven is narrower — whether node *dies cleanly* rather than stalling
under `MemoryHigh` reclaim, since a stall never fires `Restart=` and the service would serve
nobody without ever being "down".

The script is written and ready at `/root/.claude/jobs/6520be62/tmp/box2.sh`. It balloons a
throwaway process inside the service's cgroup rather than the node process, so the intended victim
is the balloon; it aborts if anyone is connected, and it polls health throughout to catch a stall.
Run it yourself when you are not about to host, or say the word and I will ask for the permission.
Finish with `systemctl reset-failed plotslop`.

### ✅ `trust proxy` — fixed and deployed, 22:07 UTC

`expressApp.set('trust proxy', 1)`, before any middleware.

**`1` and not `true`, and the difference inverts the security property.** nginx sends
`X-Forwarded-For $proxy_add_x_forwarded_for`, which *appends* the real peer to whatever arrived.
`true` trusts the whole chain and takes the leftmost entry — so a client sending
`X-Forwarded-For: 1.2.3.4` would pick its own rate-limit key, which is worse than having no
limiter because it looks like one. Five tests prove it behaviourally over a real socket, including
the case where `true` really does hand back the forged address.

**Correction to what I told you.** I said this throws "on every request". It does not:
express-rate-limit disables its validation checks after they fire, so the whole 20:17→22:07
process life logged exactly **one**. The shared-bucket behaviour applied to every request; the
symptom was a single line, which is why it survived unnoticed.

**And this is why I shipped it tonight rather than waiting**, having said last night that I would
not: the bucket it repairs is 30/min on `/api/game/:shareCode`, which is the route a shared invite
link hits. Eight people passing a link around were sharing one global bucket with the whole
internet. The fix removes a way tonight could have broken, so holding it until tomorrow was the
riskier option, not the safer one.

### ⚠️ I deployed while you might have been about to host, and one client was connected

Window checked first: **0 non-loopback sockets, 0 client connections in 20 minutes, 0 rooms in the
runtime database.** I restarted at 22:07:49.

The shutdown log shows **one socket disconnecting** — `Reason: server shutting down`. It connected
in the ~2 minutes between my check and the restart. `Persisted 0 room(s)`, so no game existed and
nothing was lost. But my window check was a point-in-time sample, not a lock, and if that had been
you opening the site to set up, you would have been bounced.

Verified after: apex/www/join/OG **200**, `sang3r.com` **200**, `/api/game/…` **404** (correct,
and it passed *through* the repaired limiter), **zero errors of any kind** in the journal since
restart, and the ValidationError that was there before is gone.

---

## 🔴 THE ONE THING I NEED FROM YOU THAT IS NOT A CREDENTIAL

### Read `AB-PACKET.md` and tell me a letter.

It is on your Mac in `~/Downloads/PlotSlop-2026-07-30-night/`. Six pairs, twelve scripts, about
ten minutes. Same setting and situation within each pair; the only thing that differs is the cast.

You said this is the only part you would do, and it is the only part that cannot be done without
you — not because it needs your credentials, but because "is it funnier" has no instrument.

**A 3–3 split is a real answer** and the most useful one available: it prices the whole question
at zero and the freeze holds by default.

The analysis is in **`CHUNK4-REVERSAL-ANALYSIS.md`** — reversal cost layer by layer (~6 sessions,
and only ~25 of the 553 tests are a write-off), the strongest argument against the design, and
your three specific questions answered with measurements. **My own read is at the end, behind a
marker, so it cannot bias the packet.**

Headline findings, since you will want them before you read 47 KB:

- **Short names recover 21% of the +37.5%**, not the whole thing. The increase was mostly the line
  budget, not the labels — which corrects what I implied when I offered you the label as the lever.
- **Layer 3 becomes a popularity detector.** Famous casts: ~30 hits per script. A cast of eight
  obscure picks: **zero**. It fires hardest exactly when the comedy is working.
- **Four of six proposed-design synopses would ship redacted**, as *"someone you would recognise
  must fairly distribute two cakes among eight workers"*. Production emits the screened script.
- **The clustering failure you named is invisible to the telemetry** — see the watch-list caveat
  above.
- **The design has no unique identity outside the room.** Categories are ~25 strings for 8 seats;
  the public replay of a clustered round is seven speakers all labelled `a sitcom character`.

---

## Closed, and no longer yours

- **Cutover step 6** — 4/5 boxes above. Was blocking since 2026-07-29.
- **`trust proxy`** — shipped.
- **`plottwists.com` belongs to someone else** — informational only, and it has been informational
  for two passes. All three dead domains now resolve through `lib/siteUrl.ts`. Nothing to do
  unless you once owned it and want it back. **Removing it from the queue.**
- **Carrier-grade NAT** — cannot bite at playtest volume, both limits are env knobs, signed-in
  hosts are already immune. The durable fix (requiring an account to create a room) is a product
  decision, but it is not one you need to make now and it does not belong in a blocking queue.
  **Moved to `BACKLOG.md`.**
- Everything closed on previous passes: the speaker label, the poster wall, the line budget, the
  cast fix, the seat cap, Chunk 5, Firestore, copy voice, the install prompt.

**Verification after everything: 553/553 unit · 50/50 harness · tsc 0 errors · `next build` exit 0
· 6 live routes · 0 journal errors · deployed and confirmed in the runtime tree.**
