# Session report — 2026-07-29, evening

**Scope:** everything done since your instruction beginning *"Dev Clerk keys incoming"*, plus the
key paste that followed it.

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

---

## Bottom line

**PlotSlop is live on `https://plotslop.com` and a second client can join a room.**

Cutover steps 1–5 and 7 are applied. **Step 6 is yours and still blocking** — exact commands and
pass criteria in §7b. sang3r.com was verified up after every nginx reload.

Getting there took four attempts and turned up **two real bugs in `deploy.sh`**, neither of which
had ever been hit because nothing had ever executed that path.

| Asked for | State |
|---|---|
| Clerk dev keys to `/etc/plotslop/env`, 600 root:root, containment checks | done, verified |
| `next build` goes green | done, verified two ways |
| Grep both repos for `clerk.plot-twists.com` / `plot-twists.com` survivors | done, ~a dozen live refs, §3 |
| Vercel: link check | done, clean, nothing links to it |
| Vercel: delete | **blocked** — no Vercel credential on this box |
| Run the cutover end to end, stop at step 6 | **done**, stopped at 6 |
| Leave you the exact step-6 command and pass criteria | done, §7b |
| Hit `https://plotslop.com`, open a room, join from a second client | **done, passed** |

---

## 1. Clerk dev keys — DONE

Both written to `/etc/plotslop/env`. Permissions **`600 root:root`**, root-owned, outside the repo
and outside `/root`.

Containment checked the same way as the Anthropic key:

- `grep -rlF` for each of the three secret values across **both** repos — no hits.
- `git status` clean in both repos.
- Nothing written to `.env.local`, any repo file, or any test fixture.
- The harness still forces `sk-ant-harness-fake`; tests were not repointed.

`[VPS] bash scripts/cutover.sh --check` passes **all 11 preconditions**, including that
`FIREBASE_SERVICE_ACCOUNT_KEY` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` remain unset so the JSON
adapter stays the database (`DECISIONS.md` #7 is still open). Confirmed at runtime, not just at
precondition time — the service logs `Database connected using JSON file adapter`.

### One check worth reporting, because it speaks to the `pk_live` you nearly sent

A Clerk publishable key is base64 and carries its own instance hostname, so this can be **read**
rather than inferred from the `pk_test_` prefix:

```
$ grep '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' /etc/plotslop/env \
    | sed 's/^[^=]*=pk_test_//' | base64 -d
alive-jawfish-19.clerk.accounts.dev
```

A genuine dev instance, no DNS dependency, and **not** bound to `clerk.plot-twists.com`.

### A note on the file's own header comment

`/etc/plotslop/env` says `chmod 640 root:plotslop` in its header. Actual state is `600 root:root`,
per your instruction. That is *tighter* and still correct: systemd parses `EnvironmentFile=` as
PID 1 (root) before dropping to `User=plotslop`, so the service never needs read access itself.
**Now empirically confirmed** rather than argued from the docs — the service started and read its
environment at `600 root:root`. The header comment is stale and should be corrected.

---

## 2. `next build` is green — DONE

Exit 0, `Compiled successfully`.

Confirmed by the **specific route that was failing**, not by the exit code alone: `/admin` now
appears in the route table as `(Static) prerendered`. That is the page that threw
`@clerk/clerk-react: Missing publishableKey` and killed every Vercel preview build.

---

## 3. The rename inventory — you were right, and it is worse than one config

You suspected "at least one live auth config." It is roughly a dozen live references.

### The auth one you suspected

`PlotTwists/iOS/PlotTwists.entitlements:15` — `webcredentials:clerk.plot-twists.com`.

It **is** recorded as a security item (`CHUNKS.md` #15, `DECISIONS.md` #1). The gap is elsewhere:
**`INVENTORY.md`'s domain table has no row for web-credentials domains at all.** Its "Universal
links" row cites `entitlements:13-14` and stops, so the inventory undercounts by exactly the auth
entry. That is the miss.

### The one that bites now rather than pre-launch

`app/layout.tsx:55`

```ts
const metadataBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || 'https://plot-twists.com'
```

**Neither variable is set in `/etc/plotslop/env`**, so `metadataBase` resolves to the dead domain
and every `og:image` / `twitter:image` **absolute** URL on the now-live site points at nothing.
Broken link previews in iMessage, Discord and Twitter.

For a game whose entire join path is "share a link," that is the worst possible place for it. The
fix is one line in the env file plus a restart. **I did not apply it** — you framed the domain work
as blocking pre-launch rather than tonight, and this is config on a service that is now serving.
Say the word and it is a two-minute change.

### Full live inventory

| # | Location | What it is | Consequence |
|---|---|---|---|
| 1 | `app/layout.tsx:55` | `metadataBase` fallback | Every OG/Twitter image URL points at a dead domain |
| 2 | `server/routes/stripe.ts:292` | `images: ['https://plot-twists.com/icon.svg']` | Broken product image **in the Stripe checkout** |
| 3 | `app/api/clip-card/[gameId]/route.tsx:144` | Renders the literal text | Baked into **every shareable clip card image** |
| 4 | `lib/scriptUtils.ts:36` | Appended to script exports | Dead URL on every exported script |
| 5 | `app/privacy/PrivacyContent.tsx:48,145` | "website at plot-twists.com", `privacy@plot-twists.com` | Legal page names the wrong site plus a dead mailbox |
| 6 | `app/terms/TermsContent.tsx:158` | `support@plot-twists.com` | Dead support address on a legal page |
| 7 | `ios/App/App/App.entitlements:11-12` | `applinks:` plus `webcredentials:plot-twists.com` | Capacitor shell; same class as the native entitlement |
| 8 | `android/app/src/main/AndroidManifest.xml:29` | Deep-link host | Android deep links point at a dead domain |
| 9 | `PlotTwists/iOS/PlotTwists.entitlements:13,14,15` | `applinks:` x2 plus **`webcredentials:clerk.`** | The security item; #15 is the auth one |
| 10 | `PlotTwists/Shared/Config.swift:36` | `static let webDomain` | **Source of the QR code and invite URL** |
| 11 | `ResultsView.swift:1447,1573,1934` | Share text x2, displayed domain x1 | User-visible on the results screen |
| 12 | `ScriptViewer.swift:572` | Export footer | User-visible in exports |
| 13 | `TVLobbyView.swift:147` | "or visit plot-twists.com" | User-visible on the TV lobby |
| 14 | `PlotTwistsTests/PlotTwistsTests.swift:7` | Asserts `webDomain == "plot-twists.com"` | Will fail when #10 is fixed. Expected, not breakage |
| 15 | `server.ts:38-39` | CORS allowlist | **Already tracked** — `CHUNKS.md` Chunk 5 step 7 |

Docs-only mentions (`AUDIT.md`, `INVENTORY.md`, `CHUNKS.md`, `HANDOFF.md`, `DECISIONS.md`,
`docs/superpowers/**`) are excluded — they are historical records and correctly describe the old
name.

**Nothing in this table was changed.** All of it is yours to sequence.

---

## 4. Vercel — link check clean, delete blocked on your credential

### Link check: clean

Nothing in either repo links to a `*.vercel.app` URL for this project. The only hit anywhere was
my own note in `NEEDS-JACKSON.md` saying the check had not been done.

Second mechanism: no nginx config on this box references a Vercel host for this project either.
The only `vercel` mentions under `/etc/nginx/` are comments in `sogojet.com`, documenting rewrites
ported *away* from Vercel.

So there is nothing to break by pulling it.

### One thing the check turned up that argues *for* deleting

`server.ts:52`

```ts
const VERCEL_PREVIEW_REGEX = /^https:\/\/(plotslop|plot-twists)(-[a-z0-9-]+)*\.vercel\.app$/
```

While that Vercel project exists, **any** preview deploy under those names is an origin the
production game server trusts for CORS. **That server is now live**, so this stopped being
theoretical this evening. Deleting the project removes a trusted-origin surface, not just an email
nuisance.

### Why I could not do the delete

| Credential | State |
|---|---|
| `~/.local/share/com.vercel.cli/auth.json` | `{}` — empty, no token |
| `vercel` CLI on PATH | not installed |
| `.vercel/project.json` in the repo | absent, project not linked locally |
| `gh` token scopes | `gist, read:org, repo` — no `admin:repo_hook`, so I cannot even remove the webhook |

It needs your Vercel login. `[MACBOOK]` or any browser: Vercel → the project → Settings → Delete
Project.

The narrow suppression from earlier today (`vercel.json` → `git.deploymentEnabled` false for
`audit/2026-07-28-snapshot`) is still in place and still stopping the emails.

---

## 5. The cutover — four attempts, two real bugs, one false alarm

`cutover.sh --apply` runs `deploy.sh` as step 1. Under `set -euo pipefail`, a failure there aborts
everything, so on attempts 1–4 **steps 2 through 7 never executed.** No nginx change, no cert
change, no TLS swap. That containment is why sang3r.com was never at risk during the flailing.

### Attempts 1 and 2 — `npm prune` ERESOLVE

```
npm error While resolving: ts-jest@29.4.6
npm error Found: typescript@6.0.3
npm error Could not resolve dependency: peer typescript@">=4.3 <6" from ts-jest@29.4.6
```

**Root cause.** `deploy.sh` sources `/etc/plotslop/env` under `set -a`, which exports everything in
it, including `NODE_ENV=production`. That is correct for the *runtime* and wrong for the *build*:
npm reads `NODE_ENV` and silently sets `omit=dev`, so `npm ci` installed 454 production packages
and **skipped typescript, which is a devDependency**.

`next build` then found `tsconfig.json` with no typescript, helpfully installed `typescript@latest`
(6.0.3), and **rewrote `package.json` and `package-lock.json`, clobbering a deliberate exact pin at
`5.9.3`**. `ts-jest@29.4.6` declares peer `typescript >=4.3 <6`, so the `npm prune --omit=dev` that
follows died on ERESOLVE — *after* the build had already succeeded, which is why the log reads
clean right up to the failure.

**Correction to something I said in-session.** I first blamed my own standalone `npm run build` for
the typescript bump. That was wrong: it reproduces inside the cutover itself, with no involvement
from me.

**Verified rather than reasoned:**

```
$ NODE_ENV=production npm config get omit   ->  dev
$ env -u NODE_ENV npm config get omit       ->  (empty)
```

**Fix** (`scripts/deploy.sh`):

- `npm ci` becomes `npm ci --include=dev`
- A post-build guard that **aborts the deploy** if the build modified `package.json` or
  `package-lock.json`. Next's auto-install is silent, writes to tracked files, and is exactly the
  sort of thing that gets committed by accident three days later. A pinned dependency changing
  during a deploy should be a stop condition, not a warning.

### Attempt 3 — service died on a missing source file

```
Error: Cannot find module '../data/communityPacks'
Require stack:
- /srv/plotslop/server/services/cardpack.service.ts
- /srv/plotslop/server.ts
```

**Root cause.** The rsync filter was `--exclude 'data'`.

An rsync pattern with **no leading slash matches a name at every depth**. So the exclusion intended
to protect the top-level JSON database (`rooms.json`, `playerStats.json`, `progression.json`,
`gameHistory.json`) also excluded **`server/data/`**, which holds `communityPacks.ts`, imported by
`cardpack.service.ts` at startup.

The runtime tree came out missing a source file the app requires. Invisible from the source tree,
where the file plainly exists, and invisible from the build, which compiles the Next app rather
than the Socket.IO server.

**Fix:** `--exclude '/data'`, anchoring the pattern to the transfer root.

Rather than fix one `MODULE_NOT_FOUND` at a time, I ran a dry-run rsync with the corrected filter
and diffed the trees. Exactly **one** file was genuinely missing:

```
package-lock.json              # differs because prune rewrites it in the runtime tree
scripts/deploy.sh              # my fix
server/data/communityPacks.ts  # <- the actual bug
```

### Attempt 4 — a false alarm, and the most instructive failure of the four

After the rsync fix the service still would not start. `systemctl restart` reported failure, and
`journalctl` showed the **same `MODULE_NOT_FOUND '../data/communityPacks'` stack trace** as
attempt 3.

It was not the same bug. The fix had worked. What actually happened:

```
19:44:29  plotslop.service: Main process exited, code=exited, status=1/FAILURE   <- attempt 3
19:44:34  plotslop.service: Scheduled restart job, restart counter is at 5.
19:44:34  plotslop.service: Start request repeated too quickly.
19:47:11  plotslop.service: Start request repeated too quickly.                  <- attempt 4
```

The unit carries `StartLimitBurst=5` / `StartLimitIntervalSec=300`. Attempt 3's crashloop spent all
five starts, and systemd **latches** that: attempt 4's restart never spawned a process at all. So
the newest thing in the journal was still the previous, already-fixed crash — a fixed deploy that
reads exactly like a broken one.

`systemctl reset-failed plotslop && systemctl start plotslop` and the service came straight up:

```
[INFO] Database connected using JSON file adapter
[INFO] Created 20 community pack(s)
[INFO] Card Pack Service initialized with 21 packs
[INFO] Socket.IO configured for production mode
[INFO] > Ready on http://0.0.0.0:3100
```

**Fix:** `deploy.sh` now runs `systemctl reset-failed` before `restart`, with the reasoning in a
comment. Without it, any deploy following a crashloop shows the *previous* error as the newest log
line, and the natural response is to go re-fix something that was never broken. That is what cost
this session about an hour.

### What the three real findings have in common

None had ever been hit, because **nothing had ever executed this path.** The isolation directives,
the nginx configs and the unit file were all validated offline. The deploy script never was — and
it is the only part that had to survive contact with a real machine.

---

## 6. Live verification

### Cutover steps 2–7, applied

- `nginx -t` passed before each reload; **sang3r.com re-checked after each and returned 200.**
- Certificate: `Certificate not yet due for renewal` — the existing one from this afternoon, reused
  rather than re-issued, so no rate-limit spend.
- Unit installed, `systemctl enable` created the `multi-user.target.wants` symlink.

### TLS is now correct, and the chirpchirps mismatch is gone

```
subject=CN = plotslop.com
issuer=C = US, O = Let's Encrypt, CN = YE1
notBefore=Jul 29 17:45:25 2026 GMT
notAfter=Oct 27 17:45:24 2026 GMT
```

| Check | Result |
|---|---|
| `https://plotslop.com` | 200 |
| `https://www.plotslop.com` | 200 |
| `http://plotslop.com` | 301 → `https://plotslop.com/` |
| `https://sang3r.com` | 200 (unaffected) |

### The two-client test — PASS

A `curl 200` is **not** evidence the WebSocket path works. A wrong proxy config passes curl and
fails under a real socket, which is the entire reason `/socket.io/` has its own location block with
its own timeouts.

Two independent Socket.IO clients over `https://plotslop.com` — real TLS, real nginx, no localhost
shortcut:

```
1. host connects
  host  : connected  id=0kH4W04ECKHfqZB5AAAB  transport=websocket
2. host creates a room
  room code: 3722
3. second client connects and joins
  player: connected  id=dbgfNgXVlZPUxMWqAAAD  transport=websocket
  joined ok
4. host observes the join (cross-socket broadcast)
  host saw: {"publicId":"50aaf652-…","nickname":"SmokeTester","role":"PLAYER","isHost":false,"score":0}

PASS — two clients, real TLS, websocket transport, room created and joined.
```

Two things in there are the actual evidence, beyond "it connected":

- **`transport=websocket`**, asserted rather than observed in passing. A silent fallback to HTTP
  long-polling would pass a naive smoke test and behave badly in a real game.
- **The host observing the joiner.** A broadcast crossing between two sockets is the one thing a
  single-client test cannot fake, and it is what proves the room is shared state rather than two
  independent connections.

Script: `/root/.claude/jobs/6520be62/tmp/two-client-smoke.mjs`. Re-run with:

```
[VPS] cd /root/.claude/jobs/6520be62/tmp && node two-client-smoke.mjs https://plotslop.com
```

---

## 7. What is left

### 7a. Files changed

| File | Change | Committed? |
|---|---|---|
| `/etc/plotslop/env` | Two Clerk dev keys filled in | n/a — not in git, by design |
| `scripts/deploy.sh` | `npm ci --include=dev`; post-build `package.json` guard; `--exclude '/data'`; `reset-failed` before restart; a comment block explaining each | see §7f |
| `SESSION-2026-07-29-EVENING.md` | This file | untracked |

`package.json` and `package-lock.json` were reverted twice with `git checkout --` after the build
mutated them. Both clean.

### 7b. Step 6 — yours, blocking, and deliberately not automated

The five-box re-verification of isolation on the **running** unit. Every isolation measurement so
far was taken on a transient `systemd-run` unit carrying the same directives. That proves the
directives work. **It does not prove this unit gets them** — a typo, an override drop-in or a
delegated cgroup would look identical from outside.

Run each `[VPS]` as root. **Record the numbers, not the word "verified."**

#### Box 1 — effective limits: the unit file is the claim, the cgroup is the fact

```bash
systemctl show plotslop -p MemoryMax,MemoryHigh,MemorySwapMax,CPUQuotaPerSecUSec,TasksMax,User
cat /sys/fs/cgroup/system.slice/plotslop.service/{memory.max,memory.high,memory.swap.max,cpu.max}
```

**Pass:**

```
MemoryMax=805306368          # 768M
MemoryHigh=734003200         # 700M
MemorySwapMax=0              # <- the important one
CPUQuotaPerSecUSec=1s        # 100% of one core
TasksMax=256
User=plotslop
```

and from the cgroup files, in order: `805306368`, `734003200`, `0`, `100000 100000`.

**Fail:** `MemoryMax=infinity`, `memory.swap.max=max`, or `User=root`. Any of those means the unit
is not getting its directives, and PlotSlop can take sang3r.com down with it.

#### Box 2 — OOM kill fires *and the process dies* rather than stalling

```bash
journalctl -u plotslop | grep -i oom
systemctl show plotslop -p NRestarts
```

**Pass:** an `oom-kill` line appears, the unit exits, and `Restart=always` brings it back, so
`NRestarts` increments.

**Fail, and this is the subtle one:** the process *stalls* instead of dying. A reclaim-throttled
stall is **worse than a crash**, because `Restart=` never fires — the service serves nobody and
does not recover. `MemoryHigh` was raised 640M → 700M specifically to narrow that window; this box
is what confirms the change worked.

⚠️ Note after this evening: a deliberate OOM test will spend `StartLimitBurst`. Finish with
`systemctl reset-failed plotslop`, or the next start will refuse and show you a stale error.

#### Box 3 — CPU quota bites under a *multi-threaded* load

```bash
# A single-threaded spinner proves NOTHING — it uses one core whatever the quota says.
cat /sys/fs/cgroup/system.slice/plotslop.service/cpu.stat   # note usage_usec
sleep 10
cat /sys/fs/cgroup/system.slice/plotslop.service/cpu.stat   # usage_usec delta
```

**Pass:** the `usage_usec` delta over a 10s wall window is ≈10,000,000 µs (one core), **not**
≈20,000,000 (two), despite multiple threads competing.

#### Box 4 — `ProtectHome` denies `/root` from inside the service's namespace

```bash
PID=$(systemctl show plotslop -p MainPID --value)
nsenter -t "$PID" -m -- ls /root
```

**Pass:** it **fails** — empty or permission denied. `/root` must be *invisible*, not merely
unreadable, because that is what covers `/root/Sanger`, `/root/.sanger-monitor.env`,
`/root/.sanger-vps-api.env` and every other co-tenant secret in one kernel-enforced stroke.

**Fail:** a directory listing. Checking from outside the namespace does not count.

#### Box 5 — the data directory is inside the tree and nowhere else

```bash
PID=$(systemctl show plotslop -p MainPID --value)
ls -l /proc/"$PID"/cwd
nsenter -t "$PID" -m -- touch /srv/plotslop/nope
```

**Pass:** `cwd` → `/srv/plotslop`, and the write **fails with `EROFS`**. `WorkingDirectory` is
load-bearing rather than cosmetic: `server/db/json.ts:12` is `path.join(process.cwd(), 'data')` —
cwd-relative, not absolute. The JSON database lives inside PlotSlop's own tree only because of
that line.

### 7c. Blocked on you

| # | Item |
|---|---|
| 1 | **Delete the Vercel project.** Link check clean; no credential here. Now that the server is live, the CORS preview regex makes this slightly more than cosmetic. |
| 2 | **`NEXT_PUBLIC_BASE_URL=https://plotslop.com` in `/etc/plotslop/env`?** One line + restart, fixes every broken OG image on a site that is now serving. |
| 3 | **Step 6**, §7b. |
| 4 | **PlotSlop's own Clerk production instance** on plotslop.com. Recorded by you as blocking pre-launch. The site is currently running on a **dev** Clerk instance. |
| 5 | The `plot-twists.com` survivor table, §3. Sequencing is yours. |
| 6 | Still open in `NEEDS-JACKSON.md`: Firestore existence, copy voice, the two public-domain settings, the install-prompt-on-/join call. |

### 7d. Worth knowing now that it is live

- **Running on a dev Clerk instance.** Fine for playtesting, not for launch — item 4 above.
- **Stripe and Twilio are unset**, so payments and phone verification are disabled. The service
  logs this at startup. Deliberate, since neither is needed to play.
- **CONSTRAINT-1 is live from now on.** Every deploy restarts the process and all game state is
  process-local, so a restart ends every game in flight. `deploy.sh` prompts before restarting; from
  here that prompt is a real decision and should be answered by a human, not piped `y`.

### 7e. Docs still to update

`NEEDS-JACKSON.md` and `HANDOFF.md` need this session written in: item 1 closed, the Vercel item
updated to "link check clean, delete blocked on credential", a new section for the
`plot-twists.com` survivor table, and the three `deploy.sh` findings added to the corrections list.

### 7f. Verification state

Typecheck and the full jest suite were running when this file was written; results are in the chat
report rather than here. The `deploy.sh` changes are shell-only and touch no application code, so
they cannot move the suite — but "cannot" is a prediction, and the suite is the check.

---

## 8. State of the box

- `plotslop.service`: **active and enabled**, `Ready on http://0.0.0.0:3100`
- nginx: real TLS config live for plotslop.com + www, ACME location ahead of the 301 so renewal
  survives
- sang3r.com: **200**, verified after every reload
- certificate: valid for both names, expires **2026-10-27**, renewal dry-run passed this afternoon
- database: JSON adapter, `/srv/plotslop/data`, Firebase deliberately unset
- `/srv/plotslop`: synced, `plotslop:plotslop`
