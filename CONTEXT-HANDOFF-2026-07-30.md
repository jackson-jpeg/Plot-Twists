# PlotSlop — full context handoff

**Written 2026-07-30 for a session that has never seen the preceding conversation.**
This is a self-contained replacement for the chat it came from. Everything needed to pick the work
up is either in this file or named precisely enough to find.

Machine labels used throughout: `[VPS]` = the Linux box (source of truth), `[MACBOOK]` = Jackson's
Mac, reachable over the tunnel. **Never edit files on the Mac.**

---

## 0. How to use this document

| Part | What it is | Read it when |
|---|---|---|
| **1** | Orientation — what this is, where it lives, how to build and verify | Always, first |
| **2** | Jackson's standing rules, verbatim where it matters | Always, before doing anything |
| **3** | Current state, and how each claim was verified | Always |
| **4** | What happened in the session this file replaces | Before touching deploy/harness |
| **5** | The pattern that produced four of this session's findings | Before reporting any defect |
| **6** | What is left — mine vs. Jackson's, prioritised | When choosing what to do next |
| **7** | Landmines specific to this repo | Before your first change |
| **8** | Document map — what every other `.md` is for | When you need depth |
| **A/B/C** | `NEEDS-JACKSON.md`, `INVENTORY.md`, the session report, verbatim | Reference |

**If you read only one thing:** §2 (the scope freeze and the two-mechanisms rule), then §6.

---

## 1. Orientation

### What PlotSlop is

An AI-powered improv party game. Players pick character/setting/circumstance cards, Claude
generates an absurd mashup screenplay, players perform it live and vote for MVP. Jackbox-shaped.

It was called **Plot Twists**. It is being renamed to **PlotSlop**. The old domain
`plot-twists.com` was deliberately allowed to expire (`DECISIONS.md` #1). That rename is
incomplete and is a live source of bugs — see §6 and Appendix A item 11.

### Where things are

| | |
|---|---|
| **Canonical repo** | `/root/Plot-Twists` — Next.js 16 + Socket.IO. **This is the product.** |
| **Branch** | `audit/2026-07-28-snapshot`, tracks `origin/`. **Not** `master`, **not** `v2`. |
| **Live site** | 🟢 `https://plotslop.com`, served from this VPS by `plotslop.service` on :3100 behind nginx |
| **Runtime tree** | `/srv/plotslop` — deployed copy, `plotslop:plotslop`, isolated. Never edit here. |
| **Secrets** | `/etc/plotslop/env`, `600 root:root`. Not in git, not under `/root`. |
| **iOS repo** | `/root/PlotTwists-Native` — SwiftUI/tvOS. **Shelved.** When it returns it is a HOST/TV surface only, never required for players (`DECISIONS.md` #12). |

The game ships **on the web**. Players join in a phone browser with a room code and never install
anything. This is settled (`DECISIONS.md` #12) and shapes most open decisions.

### Commands that matter

```bash
[VPS] cd /root/Plot-Twists

npx jest                              # unit suite      → expect 450/450, 32 suites
npx tsx scripts/harness/run.ts        # realtime harness → expect 49/49 (~2 min)
npx tsc --noEmit                      # typecheck        → expect 0 errors

sudo bash scripts/cutover.sh --check  # 11 preconditions, non-mutating
sudo bash scripts/cutover.sh          # DRY RUN — the default, prints the plan
sudo bash scripts/cutover.sh --apply  # the real thing
sudo bash scripts/deploy.sh           # build + sync to /srv/plotslop + restart
```

The harness forces its own fake API key, its own mock Anthropic base URL, **and its own temp
database** — pass none of them. See §5, this is load-bearing.

### The machine

Linux VPS. You **cannot** run `swift`, `xcodebuild`, `xcrun`, `simctl`, or `open` — a PreToolUse
hook blocks them. iOS/macOS work goes through `ios build|run|install|ship` and `mac ...`, which
handle SSH and rsync. Files in `.macsync`-marked projects auto-push to the Mac on every write.

This box also serves **sang3r.com** (Jackson's personal site, `sanger-next.service`) from the same
nginx. A bad nginx config does not degrade PlotSlop — it stops nginx from *loading* and takes
sang3r.com down with it. Every nginx change must be `nginx -t`'d before reload and sang3r.com
re-checked after.

---

## 2. Jackson's standing rules

These are not suggestions and several were given as explicit instructions to hold him to.

### 2.1 The scope freeze — quote it back, do not negotiate

> No new features until chunks 1–4 ship and I have played this with eight people who are not my
> friends. Referrals, weekly challenges, and tvOS were built while the deployment was dead and the
> suite was red since April. If I ask you for feature work before that playtest, refuse and quote
> this paragraph back at me. That includes anything I frame as "quick" or "while we're in here."
>
> — Jackson, 2026-07-28

He asked to be refused. "Quick" and "while we're in here" are explicitly covered. Parked ideas go
to `BACKLOG.md`, which stays closed until the playtest. **Bug fixes and the chunk work itself are
not features and are fine.** Observability he asked for is not a feature either — he ruled on that
directly, and added: *"Don't extend that judgement any further without asking."*

### 2.2 Two mechanisms, or it is not a finding

**No defect is reported without independent confirmation by a mechanism *different* from the one
that found it.** Not a second run of the same instrument — a different instrument.

**The rule holds with the sign reversed: a convenient green is a hypothesis too.**

This rule earned its keep four times in one session (§5). Cost of following it is minutes.

### 2.3 Secrets

- Real keys go to `/etc/plotslop/env`, `600 root:root`. **Never** the repo, `.env.local`, or
  anything git-tracked.
- After writing one: confirm `git status` clean and that `grep -rlF` finds the value nowhere under
  either repo.
- **The harness keeps using `sk-ant-harness-fake`. Do not repoint tests at a real key.**
- `scripts/real-generation.ts` is the *only* thing that talks to the real API. It costs money per
  run and is never invoked by jest or the harness.

### 2.4 Git

- `audit/2026-07-28-snapshot` is **a backup, not a merge.** Do not touch `master` or `v2`, do not
  open a PR.
- Commit after every meaningful change, with a message that explains *why*.

### 2.5 Communication

- Label commands `[VPS]` or `[MACBOOK]`.
- **One human queue**, at the end, in `NEEDS-JACKSON.md`. Do not scatter asks through prose.
- Say whether a moved number is *coverage* or *behaviour*. "The harness went up" is not
  information.

### 2.6 Specific standing decisions

- **No AAAA record for plotslop.com.** *"Deliberately. Don't add one."*
- **Firebase env vars stay unset.** Setting them switches the live DB off the JSON adapter onto a
  project whose security rules nobody has read. `cutover.sh` refuses to run if they are ever set.
  `DECISIONS.md` #7 is open.
- **Script length: 30–38 lines, `max_tokens` 2,600.** His reasoning, worth keeping: *"8 people
  performing 70 lines is where a party stops being fun, and I'd rather they want another round than
  check out mid-scene."*
- **Studio Head tier is web/Stripe only.** If it ever ships through Apple IAP that tier gets
  re-run — 1.17× margin at observed max is not a business (`DECISIONS.md` #9, closed).
- **The straight man is cast by the prompt, not by `characters[0]`.** No deck annotation.

### 2.7 A constraint that has been SUPERSEDED — do not re-apply it

An earlier instruction read: *"Explicitly do not: enable or start `plotslop.service`, change DNS,
request a certificate, or write real secrets. The cutover is my step."*

**All four were subsequently released by Jackson**, in two steps: he pointed DNS himself and
authorised certbot, then said *"run the cutover yourself, end to end. Stop at step 6."* The service
is now deliberately running and enabled. Do not "restore" the old constraint.

**What is still his:** cutover **step 6** (the cgroup re-verification), and anything the Vercel or
Clerk dashboards require.

---

## 3. Current state — and how each claim was checked

| Claim | Verified by |
|---|---|
| `plotslop.service` **active and enabled** | `systemctl is-active` / `is-enabled`, plus `Ready on http://0.0.0.0:3100` in the journal |
| `https://plotslop.com` → 200 | curl; `www` also 200; `http://` 301s to https |
| Certificate is PlotSlop's own | `openssl s_client` → `subject=CN = plotslop.com`, expires **2026-10-27**, renewal dry-run passed |
| **sang3r.com unaffected** | curl 200, re-checked after every nginx reload |
| Two clients can share a room | Two independent Socket.IO clients over public TLS; host observed the joiner; both `transport=websocket` |
| Unit suite **450/450** (32 suites) | `npx jest` |
| Harness **49/49** | `npx tsx scripts/harness/run.ts`, after the isolation fix — see §5 |
| Typecheck **0 errors** | `npx tsc --noEmit` |
| No secret in either repo | `grep -rlF` per value; `git status` clean |
| Push triggers no Vercel build | `gh api .../statuses` → `0` |

**HEAD:** `2b3ed527`. The cutover work is `3a525195`.

### What is deliberately not configured

- **Running on a *dev* Clerk instance** (`alive-jawfish-19.clerk.accounts.dev`). Fine for
  playtesting, **not for launch.**
- **Stripe and Twilio unset** — payments and phone verification disabled, logged at startup.
  Neither is needed to play.
- **Firebase unset** — the JSON adapter at `/srv/plotslop/data` is the database, on purpose.

### 🔴 CONSTRAINT-1 is now live

All game state is process-local, so **every deploy ends every game in flight.** `deploy.sh` prompts
before restarting. Until tonight that prompt could be safely piped `y` because the service had
never run. **From now it is a real decision and belongs to a human.** Weekday daytime only, never
Friday–Sunday evening.

---

## 4. What happened in the session this file replaces

Jackson's instruction was: install the dev Clerk keys, confirm `next build` green, grep both repos
for `plot-twists.com` survivors, link-check then delete the Vercel project, and run the cutover end
to end stopping at step 6 — *"Don't call it done until you've hit https://plotslop.com, opened a
room, and joined it from a second client."*

### Done

- **Clerk dev keys installed and contained.** The publishable key is base64 and carries its own
  instance hostname, so it was *read* rather than inferred from the `pk_test_` prefix — it decodes
  to `alive-jawfish-19.clerk.accounts.dev`, confirming it is not bound to the dead
  `clerk.plot-twists.com`. That was the specific thing he was worried about.
- **`next build` green**, confirmed via `/admin` — the route that was throwing `Missing
  publishableKey` — rather than by exit code.
- **The `plot-twists.com` grep**, which found ~a dozen live references. Appendix A item 11.
- **Vercel link check: clean.** Nothing in either repo references a `*.vercel.app` URL for this
  project; no nginx config does either. **The delete is blocked** — no Vercel token on the box, and
  the `gh` token lacks `admin:repo_hook`.
- **Cutover applied**, steps 1–5 and 7. Step 6 left for Jackson.
- **The two-client test**, passed.

### Four bugs found doing it

Three in `deploy.sh`, which had never been executed by anything; one in the harness.

1. **`npm ci` silently skipped typescript.** `deploy.sh` sources `/etc/plotslop/env` under `set -a`,
   exporting `NODE_ENV=production` — correct for the runtime, wrong for the build. npm reads it and
   sets `omit=dev`. `next build` then auto-installed `typescript@6.0.3` and **rewrote `package.json`,
   clobbering a deliberate exact pin at 5.9.3**; `ts-jest`'s peer range is `>=4.3 <6`, so the
   following `npm prune` died — *after* the build succeeded, so the log read clean up to the
   failure. Fixed: `npm ci --include=dev`, plus a guard that aborts if the build edits
   `package.json`/`package-lock.json`.
2. **The rsync filter deleted a source file.** `--exclude 'data'` is unanchored, so it matched at
   every depth and excluded `server/data/` along with the top-level database. The runtime tree
   shipped without `communityPacks.ts`, which `cardpack.service.ts` imports at startup. Fixed:
   `--exclude '/data'`. Found by diffing the trees, not by chasing one `MODULE_NOT_FOUND` at a time.
3. **systemd latches `StartLimitBurst`.** After the crashloop from (2), the next `restart` never
   spawned a process — so `journalctl` still showed the *previous, already-fixed* crash. **A fixed
   deploy read exactly like a broken one**, and that cost about an hour. Fixed: `reset-failed`
   before `restart`.
4. **The harness shared a database with every previous run.** See §5 — this is the important one.

### Files changed

| File | Change |
|---|---|
| `scripts/deploy.sh` | the three fixes above, each with the reasoning in a comment |
| `scripts/harness/run.ts` | forces a private `mkdtemp` database per run, removed on exit |
| `server/db/json.ts` | honours `PLOTSLOP_DATA_DIR`; **default unchanged** |
| `NEEDS-JACKSON.md` | items 1, 3, 5 closed/updated; item 11 added |
| `HANDOFF.md` | §1 table refreshed; §9 corrections 10–12 added; §10 → §11 |
| `SESSION-2026-07-29-EVENING.md` | new — Appendix C |
| `/etc/plotslop/env` | two Clerk keys (not in git, by design) |

---

## 5. The pattern — read this before reporting any defect

Four of this session's findings were **instruments failing a working product.** They are worth
studying as a group because the failure gets progressively harder to spot.

**The `max_tokens` floor (earlier that day).** The harness identified script-generation calls by
`max_tokens >= 5000`, a threshold picked when ENSEMBLE asked for 10,000. When the ceiling dropped
to 2,600, three checks reported *"0 generation requests reached the model."* Obviously silly, easy
to catch. Fixed by putting the floor **between** the two populations (1,000; non-script calls are
400/500, the smallest script call is 2,048) and having it assert its own separation at startup.

**The systemd start-limiter.** Showed a real error that was simply *stale*. Harder — the log was
truthful, just not current.

**The harness database.** The worst, because its output was **more plausible than the truth.**

`server/db/json.ts` resolved `<cwd>/data`, so the harness wrote to `/root/Plot-Twists/data`, shared
with every previous run and any dev server. `loadRoomsFromFirestore()` runs at startup, so each run
loaded every room any earlier run had ever created — **961** of them.

On a commit where everything passed, it reported **38/46 with eight failures**:

```
hostAbandon · emptyResults · voterDrop · rateLimit · identity · spectatorVote · aiFailure ×2
```

Every one of those is an original audit finding. Every one was fixed and verified fixed. Eight
regressions appearing at once, right after a deploy, naming exactly the bugs the whole audit has
been about — a coherent, alarming, *reportable* story. All eight were false.

Confirmed three ways, same commit, minutes apart:

| Condition | Result |
|---|---|
| 961-room accumulated DB | **38/46**, eight fabricated failures |
| empty DB | **49/49** |
| 961-room DB + isolation fix | **49/49**, dev DB byte-identical afterwards |

Fixed as described in §4. **The only reason it was caught** is that the denominator was 46 rather
than 49 — three checks never ran, because wedged rooms aborted them — and that discrepancy had no
explanation. Chasing the unexplained number rather than re-running until it looked right is the
whole technique.

> A gate that fails a working product is bad. A gate that fails it **by naming the bugs you already
> believe in** is worse, because it survives scrutiny.

**Live consequence:** anyone who ran that harness on this box in recent weeks was reading a partly
fabricated result. If an older note reports harness failures from that list, re-run before acting.

---

## 6. What needs to be done

### 6.1 Blocked on Jackson — in priority order

| # | Item | Why it matters |
|---|---|---|
| 1 | **Cutover step 6** — cgroup re-verification on the *running* unit | Every isolation measurement so far was on a transient `systemd-run` unit. That proves the directives work, not that **this** unit gets them. Commands + pass/fail per box: Appendix C §7b. |
| 2 | **`NEXT_PUBLIC_BASE_URL=https://plotslop.com`** in `/etc/plotslop/env` | Unset, so `metadataBase` falls back to the dead domain and **every OG image on the live site points at nothing**. Broken link previews for a game whose join path is sharing a link. One line + restart. |
| 3 | **Delete the Vercel project** | Link check clean, no credential on this box. `server.ts:52` CORS-trusts `*.vercel.app` preview origins, and that server is now live. |
| 4 | **A Clerk *production* instance** for plotslop.com | The site runs on a dev instance. The `pk_live` he nearly sent was bound to `clerk.plot-twists.com`, the dead domain. Blocking pre-launch. |
| 5 | **Does the Firestore project exist at all?** | `DECISIONS.md` #7. If no project exists it closes as moot. If one does, collection names and doc counts are needed **before anything is deleted** — if non-Jackson user records sat under permissive rules that is a disclosure question. |
| 6 | The `plot-twists.com` survivor table | Appendix A item 11. Sequencing is his. |
| 7 | Copy voice (`DECISIONS.md` #10), the install prompt on `/join`, the two public-domain settings | Lower stakes; all in Appendix A. |

### 6.2 Available to do without him

- **Nothing is half-finished.** The tree is clean at `2b3ed527`, all three verification gates green,
  service healthy.
- The obvious next work is **Chunk 5** (`CHUNKS.md`) — the rename completion, which is what the
  Appendix A item 11 table feeds. It needs his sequencing call first (6.1 #6).
- `server.ts:38-39` still CORS-allows `plot-twists.com`; `CHUNKS.md` Chunk 5 step 7 says remove it
  *after the cutover settles*. The cutover has now happened, so this is newly actionable.
- The `/etc/plotslop/env` header comment claims `640 root:plotslop`; actual is `600 root:root`.
  Cosmetic, now empirically confirmed correct.

### 6.3 Do not do

- Any feature work (§2.1).
- Repointing the harness at a real API key (§2.3).
- Adding an AAAA record (§2.6).
- Setting the Firebase env vars (§2.6).
- Touching `master` or `v2`, or opening a PR (§2.4).
- Piping `y` into `deploy.sh`'s restart prompt now that the service is live (§3).

---

## 7. Landmines specific to this repo

**The suite being green is the state to be most careful with.** An assertion audit found 8 tests
across 5 suites that encoded known defects *as expected behaviour*. All 8 were inverted into gates
and are now green because their chunk items landed — each proved to fail with its fix reverted
before being believed. **Reverting an inversion to "restore green" recreates the exact problem that
was just removed.** `HANDOFF.md` §3 has the full table. (Older notes may describe these as "5
failing tests that are deliberate gates" — that is stale; they pass now, and they should.)

**`WorkingDirectory` in the systemd unit is load-bearing.** `server/db/json.ts` resolves
`path.join(process.cwd(), 'data')` — cwd-relative, not absolute. The database lives inside
PlotSlop's own tree only because of that line.

**`audience.service.ts:562` logs `parsed.map is not a function` in every harness scenario.** That
specific error is a mock artifact and pre-existing; the unguarded cast behind it is a real S3. Do
not report it as new.

**IP protection is three layers, not one.** Catalog grammar (the character slot is a *trait*, not a
person), server-side validation that submitted card IDs resolve against the catalog, and output
screening. Layer 1 took two attempts. A fifth franchise leak was found in the live SOLO prompt
reading *"If the setting is from a known show/universe, USE THOSE CHARACTERS"* — every layer passed
it, because the source audit looks for franchise *names* and there is no name in that sentence.
**The generalisation: a leak does not need a proper noun, it needs PERMISSION.**

**Carrier-grade NAT.** Rate limiters are keyed on client IP, which fixed a real bypass but puts
thousands of unrelated mobile subscribers in one bucket. Cannot bite at playtest volume; at scale it
presents as *"the game is broken on mobile data"*, not as a rate limit. Both limits are env knobs.

---

## 8. Document map

| File | What it is |
|---|---|
| `HANDOFF.md` | **Read first.** Living state doc: where things are, what a fresh session gets wrong, §9 is the running list of corrections to the record (now twelve). |
| `NEEDS-JACKSON.md` | The single human queue. **Appendix A below.** |
| `INVENTORY.md` | Every domain, credential, endpoint, bundle ID and hardcoded name. **Appendix B below.** |
| `SESSION-2026-07-29-EVENING.md` | The cutover session in full, incl. step-6 pass criteria. **Appendix C below.** |
| `AUDIT.md` | 1,538 lines. The original adversarial audit. Severity-graded findings. |
| `DECISIONS.md` | Numbered decisions with reasoning. #7 (Firestore) and #10 (copy voice) open. |
| `CHUNKS.md` | The work plan. Chunks 1–3 done, 4 layer 1 redone, 5 is the rename. |
| `BACKLOG.md` | Parked ideas. **Closed until the playtest.** |
| `PLAYTEST-2026-07-29.md` | The packet — 40 dealt hands, real generated scripts, measured costs. |
| `/root/PlotTwists-Native/AUDIT-iOS.md` | iOS audit. Shelved. |

---
---

# APPENDIX A — `NEEDS-JACKSON.md` (verbatim)

# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Updated 2026-07-29 (second pass). Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and
said so.

**Closed since this morning:** Q1, the catalog rewrite (`HANDOFF.md` §8). **Closed this evening:**
DNS and the certificate (item 2), the script-length cap (`DECISIONS.md` #9, now closed on measured
margins), the straight-man casting change, the install-prompt suppression, the three secrets
(item 1), and **the cutover itself (item 5) — PlotSlop is serving on `https://plotslop.com` and a
second client has joined a room.**

**Newly opened:** item 11, the dozen surviving `plot-twists.com` references you predicted.

---

## 1. ✅ Three secrets → `/etc/plotslop/env` — DONE 2026-07-29

All three installed. **`600 root:root`**, root-owned, outside the repo and outside `/root`.

Containment verified the same way as the Anthropic key: `grep -rlF` each value across **both**
repos returns nothing, `git status` clean in both, nothing written to `.env.local` or a fixture.
The harness still forces `sk-ant-harness-fake`.

`bash scripts/cutover.sh --check` now passes all 11 preconditions.

**One check worth recording, because it speaks to the `pk_live` you nearly sent.** A Clerk
publishable key is base64 and carries its own instance hostname, so it can be *read* rather than
inferred from the `pk_test_` prefix:

```
$ ... | base64 -d
alive-jawfish-19.clerk.accounts.dev
```

A genuine dev instance, no DNS dependency, **not** bound to `clerk.plot-twists.com`.

`next build` goes **green** — confirmed by the route that was failing, not the exit code: `/admin`
now appears as `○ (Static) prerendered`, the page that threw `Missing publishableKey`.

**Two things this leaves open**, both moved down the queue:
- PlotSlop needs its own Clerk **production** instance before launch — item 11. The live site is
  currently running on a dev instance.
- The playtest packet's generated scripts, which are now unblocked and were regenerated earlier
  today against the real API.

---

## 2. ✅ DNS and TLS — DONE 2026-07-29

You pointed it, I took it to the certificate and stopped there.

`plotslop.com` → `187.77.218.14`, TTL 60, agreed by four resolvers. `www` CNAMEs to the apex.
No AAAA, as you instructed — **it stays that way; nothing here needs one.**

Certificate issued for both names, expires **2026-10-27**, renewal dry-run passes. Verified by
reading the certificate rather than trusting certbot's exit code, and by proving port 80 was
reachable from off-box before spending an issuance attempt. sang3r.com was re-checked after the
nginx reload and is unaffected.

**One thing to know before you or anyone else opens the domain:** `https://plotslop.com` currently
shows a **certificate name-mismatch warning** naming chirpchirps.com. Nothing is wrong — DNS points
here but no `:443` block claims the name yet, so TLS falls through to another site on this IP. It
resolves at cutover step 4, and only there. Plain HTTP correctly serves
`plotslop: awaiting certificate`.

---

## 3. 🟠 NEW — Vercel is emailing you about failed preview deploys. That is me.

You asked mid-session. Diagnosed, and the cause is boring; what it exposes is not.

**Why they started:** every push to `audit/2026-07-28-snapshot` triggers a Vercel preview build,
and I have pushed **20 commits to that branch today**. One email each.

**Why they fail:** reproduced locally with `npx next build` — it is not a Vercel problem.

```
Error occurred prerendering page "/admin"
Error: @clerk/clerk-react: Missing publishableKey.
Export encountered an error on /admin/page: /admin, exiting the build.
```

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is needed at **build** time, and `/admin` is statically
prerendered. Same missing key as item 1 — **the build has been broken since the key went missing,
not since I started pushing. I only made it visible, twenty times.**

**The part that actually matters: this project cannot run on Vercel at all.** `package.json`
start is `tsx server.ts` — a custom Socket.IO server. Vercel's Next.js preset never runs it, and
serverless functions cannot hold WebSocket connections. **A *successful* Vercel deploy would
produce a site where no game can start.** The last green deploy on `v2` was 2026-04-23, which is
roughly when the architecture stopped matching it. Per `DECISIONS.md` #12 the game is served from
this VPS behind nginx, so the Vercel project is a leftover pointing at an architecture the product
left behind.

**What I did:** disabled preview deploys for the audit branch only, in `vercel.json`. Narrow,
reversible, stops the emails, touches nothing else. Your account was not touched.

**What I did not do, because it is your account and your call:**

- **Delete or disconnect the Vercel project.** My recommendation. It cannot serve this product,
  and while it exists it is a live URL someone could point a domain at by mistake.
- **Keep it and set the Clerk env vars in Vercel** — sensible only if you want previews as a
  build-check. It would still not run a playable game.

**Link check now done — clean.** Nothing in either repo links to a `*.vercel.app` URL for this
project; the only hit anywhere was my own note saying the check hadn't been run. Second mechanism:
no nginx config on this box references a Vercel host for it either. So there is nothing to break by
pulling it.

**I could not do the delete.** `~/.local/share/com.vercel.cli/auth.json` is `{}` — no token on this
box — the CLI isn't installed, the repo has no `.vercel/project.json`, and the `gh` token carries
only `gist, read:org, repo`, so I can't even remove the webhook. It needs your Vercel login:
Vercel → the project → Settings → Delete Project.

**One thing the link check turned up that argues *for* deleting.** `server.ts:52` CORS-allows
`^https://(plotslop|plot-twists)(-[a-z0-9-]+)*\.vercel\.app$`. While that project exists, any
preview deploy under those names is an origin the production game server trusts — and **that server
went live this evening**, so this stopped being theoretical.

---

## 4. 🔴 Firestore — does the project exist at all?

Unchanged and still first among the deploy-blockers by risk, in your ordering.

There is **no Firebase project ID anywhere in either repo**, and
`/root/PlotTwists-Native/firebase-debug.log` shows the CLI calling `projects//services/…` — an
**empty** project segment. That session was never linked to a project.

- **If no project exists:** `DECISIONS.md` #7 closes permanently as moot. Say so and I will
  close it rather than carry it forward.
- **If one does exist:** send collection names and rough doc counts **before anything is
  deleted**. If non-Jackson user records sat under permissive rules, that is a disclosure
  question, not a cleanup question.

`[MACBOOK]` or any browser signed into Firebase. Project ID is in the console URL.

The cutover script refuses to run if the Firebase env vars are ever set, because that switches
the live database off the JSON adapter and onto a project whose rules nobody has read.

---

## 5. ✅ The cutover — APPLIED 2026-07-29. Step 6 is still yours.

**PlotSlop is live on `https://plotslop.com`, and a second client can join a room.**

Steps 1–5 and 7 applied. `nginx -t` before every reload, and **sang3r.com re-checked after each
and returned 200.** The certificate was reused (`not yet due for renewal`), so no rate-limit spend.

The chirpchirps.com name-mismatch from item 2 is **resolved** — the domain now presents its own
certificate:

```
subject=CN = plotslop.com     notAfter=Oct 27 17:45:24 2026 GMT
```

| Check | Result |
|---|---|
| `https://plotslop.com` | 200 |
| `https://www.plotslop.com` | 200 |
| `http://plotslop.com` | 301 → https |
| `https://sang3r.com` | 200, unaffected |

**And the check a curl 200 cannot make.** Two independent Socket.IO clients over the public TLS
endpoint: host created room `3722`, second client joined, and **the host observed the joiner
arrive**. That cross-socket broadcast is the one thing a single-client test cannot fake. Both
connections asserted `transport=websocket`, so a silent fall back to long-polling — which passes a
naive smoke test and behaves badly in a real game — would have failed instead.
Script: `/root/.claude/jobs/6520be62/tmp/two-client-smoke.mjs`.

### Step 6 remains yours and remains blocking

The five-box cgroup re-verification on the *running* unit. Every isolation measurement so far was
on a transient `systemd-run` unit; that proves the directives work, not that **this** unit gets
them. Full commands and pass/fail criteria for each box are in `SESSION-2026-07-29-EVENING.md`
§7b, and the checklist prints from `cutover.sh` itself.

⚠️ One addition learned this evening: a deliberate OOM test spends `StartLimitBurst`. Finish with
`systemctl reset-failed plotslop`, or the next start refuses and shows you a **stale** error.

### Now that it is live

- **Running on a dev Clerk instance** — see item 11.
- **Stripe and Twilio unset**, so payments and phone verification are off. Logged at startup.
  Deliberate; neither is needed to play.
- **CONSTRAINT-1 is live from here.** All game state is process-local, so every deploy ends every
  game in flight. `deploy.sh` prompts before restarting — from now that prompt is a real decision
  for a human, not something to pipe `y` into.

---

## 6. 🟠 NEW — the install prompt fires on the player join path

Small, and it directly contradicts the decision you just made.

`InstallPrompt` renders globally from `app/layout.tsx:159`, so it appears on `/join`. On iOS
Safari it fires on a timer regardless of which page the player is on. Under *"players join in a
phone browser with a room code, no install, ever"*, an install banner over the join flow
interrupts the exact moment that must not be interrupted — somebody who was handed a code at a
party and has thirty seconds of patience.

**I did not change it**, because it is not obviously wrong everywhere: offering PWA install to a
**host**, who will run this repeatedly on the same device, is reasonable. Which surfaces keep it
is a UX call.

| | |
|---|---|
| **A** | Suppress on `/join` and `/game`, keep elsewhere *(my recommendation)* |
| **B** | Remove entirely — "no install, ever" means what it says |
| **C** | Leave it |

---

## 7. 🟠 `DECISIONS.md` #10 — copy voice

Commit to the joke, or stay earnest? Affects ~122 copy occurrences. **Blocks Chunk 5 only.**

My recommendation is unchanged: commit to the bit in user-facing copy, leave `comedyPrompts.ts`
earnest — it is craft instruction to the model and making it ironic will measurably degrade
output.

One addition since this morning: `app/terms/TermsContent.tsx:76` states the refund policy as
"Stripe or Apple App Store". True today, wrong the moment iOS is host-only and no player ever
buys through Apple. It is a legal page, so it should be right. Folds into the same pass.

---

## 8. 🟡 NEW — two public-domain settings I flagged rather than quietly kept

Both are legal. Both are arguable, and you should get the choice.

- **"A Laboratory In A Thunderstorm With A Sheet Over Something."** Frankenstein is public domain
  (1818), but the lightning-powered laboratory is not in the novel — it is the 1931 film, which
  is not public domain. I reached for the copyrighted imagery, not the book's.
- **"An Opera House Box That Is Always Kept Empty."** Box Five is from the 1910 Leroux novel and
  is genuinely public domain, but public association runs through the musical, which is not.

Both are cheap to cut and neither is load-bearing. Default if you say nothing: they stay.

There is also a rule conflict I resolved by interpretation and should flag: your rule 2 ("no entry
may map 1:1 to an identifiable character") and rule 3 ("public domain is allowed") pull against
each other, because a Holmes or Dracula card is legal *and* nameable. I kept public domain out of
the character deck entirely and used it only in settings, where what is evoked is a scene rather
than a person. If you want named public-domain characters in the character slot, rule 2 needs an
explicit exemption.

---

## 9. 🟡 Account-required room creation, eventually

Not blocking, but you should know the ceiling exists before it bites.

Chunk 3 re-keyed the rate limiters onto client IP, which fixed a real bypass (50 rooms in ~2s by
reconnecting). The cost is that **carrier-grade NAT puts thousands of unrelated mobile
subscribers in one bucket.** At playtest volume this cannot bite — it needs eleven strangers
behind one carrier IP creating rooms inside the same five minutes. At scale it will, and it will
present as *"the game is broken on mobile data"*, not as a rate limit.

**Your web-first decision makes this more likely to matter, not less**, because every player is
now on a phone browser rather than an installed app, and phone browsers are where CGNAT lives.

Mitigated for now: both limits are env knobs, answerable from `/etc/plotslop/env` without a
deploy (`ROOM_CREATE_MAX`, `ROOM_CREATE_WINDOW_MS`, `MAX_LIVE_ROOMS_PER_CREATOR`). Signed-in
hosts are already immune — their key is the Clerk subject, not the IP.

The durable fix is requiring an account to create a room. Product decision, so it is yours, and
it is not urgent.

---

## 10. 🟡 You removed a feature and should know it stuck

Not a question, a notification, repeated because it is user-visible and easy to lose.

**"✎ Write your own" is gone.** It was the client half of D1 and it partly contradicts your own
Option B in `AUDIT.md`. As recorded there: *Option B is not dead, but it cannot return as a text
box on the submit path.*

A second one joins it today: **the card browser no longer shows a source line under each card.**
`CardBrowseModal` and `CardPicker` both rendered `item.source`, which was the franchise name. The
field is deleted, so the badge is gone. Nobody would have seen it recently — layer 1 emptied the
data a session ago — but the code was still there and would have rendered attribution to players
the moment anything repopulated it.

---

## 11. 🔴 NEW — the rename inventory missed about a dozen live references

You asked me to grep both repos for `clerk.plot-twists.com` and other survivors, and predicted the
inventory had missed "at least one live auth config." It had. It also missed eleven other things.

### The auth one you suspected

`PlotTwists/iOS/PlotTwists.entitlements:15` — `webcredentials:clerk.plot-twists.com`.

It **is** recorded as a security item (`CHUNKS.md` #15, `DECISIONS.md` #1). The gap is elsewhere:
**`INVENTORY.md`'s domain table has no row for web-credentials domains at all.** Its "Universal
links" row cites `entitlements:13-14` and stops. So the inventory undercounts by exactly the auth
entry, which is why a rename driven off that table would have left it behind.

### 🔴 The one that is live *right now*, on the site that just went up

`app/layout.tsx:55`

```ts
const metadataBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || 'https://plot-twists.com'
```

Neither variable is set in `/etc/plotslop/env`, so `metadataBase` resolves to the dead domain and
**every `og:image` and `twitter:image` absolute URL on plotslop.com points at nothing.** Broken link
previews in iMessage, Discord and Twitter — for a game whose entire join path is "share a link."

**I did not fix it.** You scoped the domain work as blocking pre-launch rather than tonight, and
this is config on a service that is now serving. It is one line plus a restart:
`NEXT_PUBLIC_BASE_URL=https://plotslop.com`. Say the word.

### The rest

| # | Location | Consequence |
|---|---|---|
| 2 | `server/routes/stripe.ts:292` | Dead `icon.svg` **in the Stripe checkout** — broken image at the moment of payment |
| 3 | `app/api/clip-card/[gameId]/route.tsx:144` | "plot-twists.com" rendered **into every shareable clip card image** |
| 4 | `lib/scriptUtils.ts:36` | Appended to every exported script |
| 5 | `app/privacy/PrivacyContent.tsx:48,145` | Privacy policy names the wrong website, plus a dead `privacy@` |
| 6 | `app/terms/TermsContent.tsx:158` | Dead `support@` on a legal page |
| 7 | `ios/App/App/App.entitlements:11-12` | Capacitor shell's `applinks:` + `webcredentials:` |
| 8 | `android/app/src/main/AndroidManifest.xml:29` | Android deep-link host |
| 9 | `PlotTwists/Shared/Config.swift:36` | `webDomain` — **the source of the QR code and invite URL** |
| 10 | `ResultsView.swift:1447,1573,1934` | Share text ×2 and a displayed domain, user-visible |
| 11 | `ScriptViewer.swift:572` | Export footer |
| 12 | `TVLobbyView.swift:147` | "or visit plot-twists.com" on the TV lobby |
| 13 | `PlotTwistsTests/PlotTwistsTests.swift:7` | Asserts the old value — will fail when #9 is fixed. Expected, not breakage |

`server.ts:38-39` (CORS) is already tracked as Chunk 5 step 7. Docs-only mentions are excluded —
they are historical records and correctly describe the old name.

Nothing in this list was changed. Sequencing is yours.

### Also still blocking pre-launch, from your own message

PlotSlop needs its own Clerk **production** instance on plotslop.com. The `pk_live` you nearly sent
was bound to `clerk.plot-twists.com`, the dead domain. The site is live on a **dev** instance until
that exists — fine for playtesting, not for launch.

---

## Not waiting on you

For completeness, so you can see what moved without you: the catalog restructure is done and
gated, four more IP leaks were found and fixed (one of them shipping to the model on every
request), the source-audit gate went from one file to five, the playtest packet is regenerated at
40 hands, and both `DECISIONS.md` #4 and #12 are written. Suite 448/448, harness 49/49, typecheck
clean. Details in `HANDOFF.md` §7 and §8.

---
---

# APPENDIX B — `INVENTORY.md` (verbatim)

# INVENTORY — PlotSlop (Phase 0)

Facts only. Gathered 2026-07-28. No findings, no opinions.
Machine labels: `[VPS]` = Linux audit host, `[MACBOOK]` = Jackson's Mac over the tunnel.

---

## 1. Repositories

| Repo | Path | Remote | Branch | HEAD | Last commit |
|---|---|---|---|---|---|
| Web + game server | `/root/Plot-Twists` | `github.com/jackson-jpeg/Plot-Twists` | `v2` (default) | `f99ab31d` | **2026-04-23** |
| iOS/tvOS app | `/root/PlotTwists-Native` | `github.com/jackson-jpeg/PlotTwists-Native` | `wip-2026-07-23` | `d016f526` | 2026-07-24 |

`[VPS] git log --since=2026-04-01 --oneline | wc -l` → **3** commits in the web repo since April 1.

Web repo remote branches (14): `v2` (HEAD), `add-claude-github-actions-1770006442031`, `claude/app-review-documentation-qYqGR`, `claude/claude-md-mkxf4wqd6frdvc7o-kYOMG`, `claude/fix-build-issues-4cPb6`, `claude/redesign-voting-ui-H4pCz`, `claude/review-architecture-features-9Zlxf`, `claude/review-project-codebase-gtHY8`, `claude/review-railway-errors-mCwZ3`, `claude/update-claude-md-CZckS`, `claude/update-claude-md-eWt6Q`, `sanger/1771819998166-step`, `sanger/1771820061669-step`.

iOS repo remote branches (3): `master` (HEAD), `wip-2026-07-23`, `fix/clerk-logger-use-log-service`.

### Repo state at audit start

`[VPS] cd /root/Plot-Twists && git status --short | awk '{print $1}' | sort | uniq -c`
```
     35 ??
    403 D
```
All 403 tracked files were staged-deleted while simultaneously present on disk and untracked. `git reflog -8` contained exactly one entry (`clone: from https://github.com/jackson-jpeg/Plot-Twists.git`), and `git stash list` was empty. Repaired during this audit with `git reset` (non-destructive, index restored from HEAD). Post-repair state: 2 modified (`package.json`, `package-lock.json`), 1 untracked (`.mcp.json`).

`package.json` local drift vs HEAD:
```diff
-    "typescript": "^5.9.3"
+    "typescript": "5.9.3"
```
(plus a corresponding 855-line `package-lock.json` reduction)

---

## 2. Deploy targets

| Target | Config | State |
|---|---|---|
| Railway | `railway.json` (NIXPACKS, `npm run start`, restart ON_FAILURE max 10) | `https://web-production-c7981.up.railway.app` → **HTTP 404** `{"status":"error","code":404,"message":"Application not found"}` |
| Vercel | `vercel.json` (`next build`, framework nextjs) | Not verified — no credentials |
| `plot-twists.com` | Hardcoded in `server.ts:32-33` CORS allowlist; `PlotTwists/iOS/PlotTwists.entitlements:13-14` | **No DNS A record.** `getent hosts plot-twists.com` → empty; `curl` → "Could not resolve host" |
| `plotslop.com` | — | Resolves to `2.57.91.91`. HTTP 200, `server: hcdn`, serves **Hostinger parked-domain page** (`<title>Parked Domain name on Hostinger DNS system</title>`) |

`[VPS] curl -sSI https://web-production-c7981.up.railway.app/socket.io/?EIO=4&transport=polling` → **404**.

Not present in this VPS's nginx (`/etc/nginx/sites-enabled/`: chirpchirps, docket4.me, dork, highdesert, leftsaid, openclaw, sang3r.com, screenreceipts, sogojet.com, vps-api).

---

## 3. Codebase size

### Web (`/root/Plot-Twists`)
- 243 `.ts`/`.tsx` files across `server/ app/ lib/ stores/ components/ contexts/ hooks/`
- `server/` = 8,587 lines across 61 files
- 62 distinct `socket.on(...)` handlers registered
- `lib/content.ts` = 1,067 lines
- `server/services/prompts/comedyPrompts.ts` = 466 lines / 23,772 bytes

Largest server modules:
| Lines | File |
|---|---|
| 717 | `server/services/audience.service.ts` |
| 551 | `server/services/room.service.ts` |
| 547 | `server/handlers/room.handler.ts` |
| 509 | `server/handlers/game.handler.ts` |
| 498 | `server/services/playerStats.service.ts` |
| 474 | `server/services/progression.service.ts` |

### iOS (`/root/PlotTwists-Native`)
- 96 `.swift` files, 30,953 lines
- Targets: `com.plottwists.app` (iOS), `com.plottwists.app.widgets`, `com.plottwists.tv` (tvOS), `com.plottwists.tests`
- Team ID `2MU4PC84GZ`, deployment target 18.0, build system XcodeGen
- Registry entry `/root/ios-toolkit/config/projects.yml`: `status: deprecated  # portfolio audit 2026-04-05`

---

## 4. Dependencies

Node `22.23.1` on the audit host; `package.json` declares `"node": "22.x"`, `.node-version` says `20.9.0`.

`[VPS] npm audit` → **42 vulnerabilities (3 low, 14 moderate, 18 high, 7 critical)**. Includes `ws` (via `engine.io-client`, `socket.io-adapter 2.5.2–2.5.6`) and `@babel/core` (arbitrary file read via sourceMappingURL).

`[VPS] npm outdated` — major-version gaps on direct dependencies:

| Package | Current | Latest |
|---|---|---|
| `@anthropic-ai/sdk` | 0.72.1 | **0.115.0** |
| `@clerk/nextjs` | 6.38.2 | 7.6.2 |
| `@clerk/backend` | 2.32.1 | 3.13.2 |
| `@google/genai` | 1.39.0 | 2.13.0 |
| `firebase-admin` | 13.6.0 | 14.2.0 |
| `@stripe/stripe-js` | 8.7.0 | 9.12.1 |
| `@stripe/react-stripe-js` | 5.6.0 | 6.8.0 |
| `@apple/app-store-server-library` | 2.0.0 | 3.1.0 |
| `jest` | 29.7.0 | 30.4.2 |
| `next` | 16.1.6 | 16.2.12 |

---

## 5. Build health

### Web `[VPS]`

| Step | Result |
|---|---|
| `npm install` | exit 0 |
| `npx tsc --noEmit` | **exit 0, zero output** |
| `npx next build` | **exit 1 — FAILS** |
| `npm test` (`jest --coverage`) | **exit 1** |

`next build` failure (compiles, then fails at prerender):
```
✓ Compiled successfully in 20.9s
  Running TypeScript ...
  Collecting page data using 1 worker ...
⚠ Using edge runtime on a page currently disables static generation for that page
Error occurred prerendering page "/_not-found".
Error: @clerk/clerk-react: Missing publishableKey.
Export encountered an error on /_not-found/page: /_not-found, exiting the build.
⨯ Next.js build worker exited with code: 1
```
Also emitted: workspace-root warning from duplicate lockfiles (`/root/package-lock.json` selected over `/root/Plot-Twists/package-lock.json`).

Artifacts produced before the failure: `.next` = 27 MB, `.next/static/chunks` = 2.4 MB.

### Tests `[VPS]`
```
Test Suites: 2 failed, 28 passed, 30 total
Tests:       4 failed, 393 passed, 397 total
Time:        39.174 s
```
Failing suites: `__tests__/unit/server/socket/helpers.test.ts`, `__tests__/unit/stores/subscriptions.test.ts`.

Failure text (representative):
```
● validateRoom › should return null and emit error for invalid room code
  Expected: "error", "Invalid room code"
  Received: "game_error_message", "Invalid room code"
```
(The event was renamed in commit `c441793f`; the tests were not updated.)

Coverage — configured threshold is 20% (`jest.config.js`), actual:
```
File                             | % Stmts | % Branch | % Funcs | % Lines
All files                        |   17.51 |    10.83 |   14.73 |   17.69
 server/handlers                 |    4.49 |     8.02 |   11.11 |    4.57
  game.handler.ts                |       0 |        0 |       0 |       0
  voting.handler.ts              |       0 |        0 |       0 |       0
 server/services                 |   41.68 |     30.5 |   42.38 |   42.16
  room.service.ts                |   68.61 |    44.73 |   78.04 |   72.75
  scriptGeneration.service.ts    |       0 |        0 |       0 |       0
  voting.service.ts              |   88.65 |    83.48 |   86.66 |   87.05
 server/services/prompts         |       0 |        0 |       0 |       0
```

### iOS `[MACBOOK]`

`ios build plottwists` → exit 70:
```
❌ xcodebuild: error: Unable to find a device matching the provided destination specifier
```
(toolkit defaults to a destination the Mac would not resolve)

Direct `xcodebuild -destination 'platform=iOS Simulator,id=E006AAFF-…'` → first attempt exit 65:
```
error: No space left on device (28) (in target 'PlotTwistsWidgets')
```
`df -h /System/Volumes/Data` → `228Gi total, 198Gi used, 115Mi available (100%)`. Cleared `~/Library/Developer/Xcode/DerivedData` (1.3 GB build cache, regenerable) → 1.2 GiB free. `~/Library/Developer/CoreSimulator` is 17 GB and was **not** touched.

Second attempt → `** BUILD FAILED **`:
```
  2 error: cannot execute tool 'metal' due to missing Metal Toolchain;
    use: xcodebuild -downloadComponent MetalToolchain
```
Swift-source error count: **0** (`grep -cE 'error: .*\.swift|SwiftCompile.*failed'` → 0). The build fails only at Metal shader compilation. The Metal Toolchain component could not be installed — the Mac data volume has ~1.2 GiB free.

**No successful iOS build was produced during this audit.** All Track 6 findings below are from source inspection, not from a running binary.

---

## 6. Test suite composition

30 test files, 397 tests. Distribution:

| Area | Files |
|---|---|
| `server/services/` | 10 (progression, voting, matchmaking, audience, directorsReview, playerStats, gameHistory, credit, room) |
| `stores/` | 7 (subscriptions, gameStore, votingStore, connectionStore, scriptStore, audienceStore, selectionStore) |
| `server/utils/` | 5 (jsonExtractor, timing, validation, retryQueue) + `server/socket/helpers` |
| `lib/` | 5 (roomRecovery, socketManager, betaFeatures, schema, homepagePosterBriefs) |
| `server/handlers/` | 2 (middleware, reconnection) |
| `server/db/` | 1 |

Multi-client / integration tests: **0**. `jest.config.js` `testEnvironment: 'node'`, `testMatch` covers `__tests__/**` only.

---

## 7. Runtime architecture

| Aspect | Fact | Evidence |
|---|---|---|
| Game state store | In-process `Map`s | `server/services/room.service.ts:20-30` — `rooms`, `roomTimeouts`, `plotTwistTimeouts`, `disconnectTimers`, `debouncedWrites` |
| Persistence | Firestore adapter, JSON-file fallback | `server/db/index.ts:12-15` — Firestore only when `FIREBASE_SERVICE_ACCOUNT_KEY` && `NEXT_PUBLIC_FIREBASE_PROJECT_ID` both set |
| Phases | 6 | `lib/types.ts:1-7` — `LOBBY, SELECTION, LOADING, PERFORMING, VOTING, RESULTS` |
| Modes | 3 | `SOLO, HEAD_TO_HEAD, ENSEMBLE` |
| Auth | Clerk, optional | `server/middleware/socketAuth.ts:47-53` — no token ⇒ `userId = null`, connection allowed ("guest mode") |
| Reconnect identity | Client-supplied `playerSessionId` from handshake | `socketAuth.ts:40-46` |
| Server framework | Express 5 + Socket.IO 4.8 + Next.js custom server | `server.ts` |

### Tuning constants (`server/utils/constants.ts`)
```
ROOM_CODE_LENGTH = 4
ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   (32 chars → 1,048,576 codes)
MAX_PLAYERS = { SOLO: 1, HEAD_TO_HEAD: 2, ENSEMBLE: 6 }
ROOM_CLEANUP_INTERVAL     = 5 min
ROOM_INACTIVITY_TIMEOUT   = 60 min
DISCONNECT_GRACE_PERIOD   = 3_000 ms
VOTING_TIMEOUT            = 60_000 ms
PLOT_TWIST_VOTING_DURATION= 15_000 ms
AI_MAX_TOKENS = { ENSEMBLE: 10000, DEFAULT: 8192 }
AI_TEMPERATURE = 1
```
`AUTO_START_THRESHOLD` (`server/services/matchmaking.service.ts:22-26`): `SOLO: 1, HEAD_TO_HEAD: 2, ENSEMBLE: 3` — the minimum non-host players required for `start_game`.

Room codes generated with `Math.random()` — `room.service.ts:142`.

---

## 8. AI layer

| Call site | Model | Notes |
|---|---|---|
| `server/services/scriptGeneration.service.ts:121` | `claude-sonnet-4-5-20250929` | streaming; `max_tokens` 8192/10000; `temperature: 1` |
| `server/services/audience.service.ts:549` | `claude-sonnet-4-5-20250929` | plot-twist options |
| `server/services/audience.service.ts:626` | `claude-sonnet-4-5-20250929` | plot-twist resolution |
| `server/services/directorsReview.service.ts:59` | `claude-sonnet-4-5-20250929` | post-game review |
| `server/services/image.service.ts:6` | `@google/genai` | poster generation |
| `lib/homepagePosterBriefs.ts:16-17` | `gemini-3.1-flash-image-preview` / `gemini-2.5-flash-image` | homepage posters |

Measured prompt size (harness, real code path): **11,938 chars system+user ≈ 2,985 input tokens** per script generation. `getSystemPrompt(false)` alone = 8,909 chars ≈ 2,228 tokens; `getModeInstructions('ENSEMBLE', …)` = 1,339 chars ≈ 335 tokens.

Timeout: hardcoded `STREAM_TIMEOUT_MS = 120_000` (`scriptGeneration.service.ts:170`).

Dead configuration in `server/utils/config.ts` — declared but never read anywhere in `server/` or `lib/`:
- `CONFIG.generation.model` (env `ANTHROPIC_MODEL`) — model is hardcoded at the call site
- `CONFIG.generation.timeoutMs` (45 s) — actual timeout is the hardcoded 120 s
- `CONFIG.rateLimits.*` (9 entries) — handlers each construct their own `SocketRateLimiter` with different numbers

---

## 9. Content library

`lib/content.ts`:
- **252** character entries (`grep -c "id: 'char-"`)
- **375** `source:` fields across all card types
- **114** distinct named franchises

Top franchises by character count:
```
14 Marvel          13 Lord of the Rings   12 Star Wars      11 Harry Potter
 8 Breaking Bad     7 The Wizard of Oz     7 The Office      7 The Good Place
 7 Parks and Recreation  7 Guardians of the Galaxy  7 Friends  7 Brooklyn Nine-Nine
 6 The Sopranos     6 The Boys             5 The Wire        5 The Simpsons
 5 The Lion King    5 Ted Lasso            5 Succession      5 Stranger Things
 5 Star Trek        5 Shrek                5 Seinfeld        5 Scooby-Doo
 5 Rick and Morty
```
Category distribution: sitcom 113, animation 104, crime 79, scifi 42, action 42, fantasy 38, classic 23, workplace 19, horror 14, mystery 11, adventure 10, romance 6.

Named real living person in the library: `lib/content.ts:340`
```ts
{ id: 'char-jerry-seinfeld', name: 'Jerry Seinfeld', category: 'sitcom',
  tags: ['comedian','neat','cereal','nothing'], maturity: 'safe', source: 'Seinfeld' }
```

Bundled crossover artwork in the iOS binary (`PlotTwists/Shared/Resources/Assets.xcassets/`): `shrek-in-seinfeld`, `barbie-in-breaking-bad`, `darth-vader-in-the-office`, `ned-stark-in-hannah-montana`, `lightning-mcqueen-in-the-sopranos`, `wednesday-addams-in-baywatch`.

The system prompt instructs the model about specific IP — `server/services/prompts/comedyPrompts.ts:415`:
```
- "The Death Star" → This is Star Wars. Natives: Darth Vader, Stormtroopers, Imperial Officers
```

---

## 10. Observability & CI

| Item | State |
|---|---|
| Error tracking | **None.** No Sentry / Bugsnag / Rollbar / Datadog in `package.json` or source |
| Logging | `lib/logger.ts` — `console.debug/log/warn/error` with a `LOG_LEVEL` gate. No transport, no aggregation |
| CI workflows | `.github/workflows/claude-code-review.yml`, `.github/workflows/claude.yml` — both Claude Code integrations. **No workflow runs build, typecheck, or tests** |
| Backup/restore | No scripts, no documented procedure |

---

## 11. Design tokens

Tokens defined in `app/globals.css` (516 lines) and `lib/design.ts`:
- `--font-display: var(--font-fredoka, 'Fredoka')` (line 15)
- `--font-body: var(--font-dm-sans, 'DM Sans')` (line 16)
- `--color-accent: #F59E42` (line 47)
- `--color-theater-bg: #09090B` (line 122) — the brief documents `#0C0C0E`
- `--color-theater-text: rgba(255,255,255,0.92)`, `--color-theater-muted: rgba(255,255,255,0.50)`

Adherence counts across `app/` + `components/` (`.tsx`/`.ts`, excluding `globals.css`):

| Measure | Count |
|---|---|
| `var(--*)` references | 2,080 |
| Hardcoded 6-digit hex literals | 261 (across 43 files) |
| `rgb()`/`rgba()` literals | 619 |

iOS (`PlotTwists/Shared/Views/`, `.swift`):

| Measure | Count |
|---|---|
| Token references (`PT.`, `Colors.`, `.ptX`) | 2,008 |
| `Color(hex:)` / `Color(red:)` literals | **0** |

Theme files present on iOS (`PlotTwists/Shared/Theme/`): Animations, Avatars, Colors, Effects, GameModeTheme, GlassComponents, LiveSpotlight, LivingBackground, PTCurtainLine, ScreenTransition, Shaders, StageAtmosphere, Styles, Typography.

**"Reely" appears zero times in either codebase.** `grep -rn -i "reely"` → 0 matches in `/root/Plot-Twists/{app,components,lib,public}` and 0 matches in `/root/PlotTwists-Native/PlotTwists/**/*.swift`. (One incidental hit in a font licence file, `Resources/Fonts/OFL.txt`.)

---

## 12. Debt markers

### iOS
| Marker | Count |
|---|---|
| `try!` / `as!` / `.unsafelyUnwrapped` | **0** |
| `print(` | 5 |
| TODO / FIXME / HACK | 15 |

### Web
- Secrets scan across full history (`git log --all -p` for `sk-ant-*`, `AIza*`, `sk_live_*`): **0 matches**
- `.env` not present; `.env.example` present (2,562 bytes)
- Dead exports confirmed: `server/middleware/rateLimiter.ts` exports `apiRateLimiter`, `roomCreationLimiter`, `scriptGenerationLimiter`, `gameMetadataLimiter` (express middlewares) — none are referenced outside that file. Only the `SocketRateLimiter` class is used.
- `lib/schema.ts` `submitCardsSchema` (zod) is defined but unused; `selection.handler.ts` uses `validateCardSelection` from `server/utils/validation.ts` instead.

---

## 13. Rename surface

Occurrence counts for case/hyphenation variants.

### Web (`.ts`, `.tsx`, `.json`, `.js`, `.css`, `.md`, `.yml`, `.toml`; excludes `node_modules`, `package-lock.json`)
| Pattern | Occurrences |
|---|---|
| `Plot Twists` | 122 |
| `PlotTwists` | 84 |
| `plottwists` | 84 |
| `plot-twists` | 35 |
| `plot-twists.com` | 27 |
| `plot_twists` | 0 |
| **Total across 98 files** | **377** |

### iOS (`.swift`, `.yml`, `.plist`, `.pbxproj`, `.entitlements`; excludes `build/`)
**349** occurrences.

### Load-bearing identifiers
| Kind | Value | Location |
|---|---|---|
| Bundle ID prefix | `com.plottwists` | `project.yml:3` |
| Bundle IDs | `com.plottwists.app`, `.app.widgets`, `.tv`, `.tests` | `project.yml:53,88,115,142` |
| Universal links | `applinks:plot-twists.com`, `applinks:www.plot-twists.com` | `PlotTwists/iOS/PlotTwists.entitlements:13-14` |
| AASA appIDs | `2MU4PC84GZ.com.plottwists.app` | `public/.well-known/apple-app-site-association` |
| Android assetlinks | `"package_name": "com.plottwists.app"`, `"sha256_cert_fingerprints": ["TODO:REPLACE_WITH_YOUR_SIGNING_KEY_FINGERPRINT"]` | `public/.well-known/assetlinks.json` |
| PWA manifest | `"name": "Plot Twists - AI Improv Comedy Game"`, `"short_name": "Plot Twists"` | `public/manifest.json` |
| npm package | `"name": "plot-twists"` | `package.json:2` |
| Production CORS allowlist | `https://plot-twists.com`, `https://www.plot-twists.com`, `https://web-production-c7981.up.railway.app` | `server.ts:32-34` |
| Vercel preview regex | `/^https:\/\/plot-twists(-[a-z0-9-]+)*\.vercel\.app$/` | `server.ts:44` |
| iOS production socket URL | `https://web-production-c7981.up.railway.app` | `PlotTwists/Shared/Config.swift:30` |

### External-name landscape (checked live, 2026-07-28)
| Source | Query | Result |
|---|---|---|
| iTunes Search API | `term=plotslop&entity=software&limit=25` | resultCount 10, **no exact match** — all fuzzy hits on "plot" (Story Plotter, Plot Flow, Zen Plot, MultiPlot, StoryCharts, …) |
| Web search | `"PlotSlop" OR "Plot Slop" trademark USPTO` | No matching trademark records returned |
| Web search | `"plotslop" app OR game OR domain 2026` | No matching app, game, or domain |
| `trademarks.justia.com` | `?q=plotslop` | HTTP 403 (bot-blocked) — could not query |

---

## 14. Harness built for this audit

`scripts/harness/` (new, committed to the working tree, not pushed):

| File | Purpose |
|---|---|
| `mock-anthropic.ts` | HTTP server speaking the Anthropic Messages protocol (streaming SSE + non-streaming JSON). Fault modes: `ok`, `slow`, `malformed`, `truncated`, `error` (529), `hang`. Records prompt size, model, `max_tokens`. |
| `server.ts` | Boots the **real** `registerAllHandlers` + `createSocketAuthMiddleware` on a bare Socket.IO server. No Next.js, no Firestore (JSON adapter fallback). |
| `run.ts` | 10 scenarios driving 1–8 `socket.io-client` instances through complete games with injected disconnects and abuse. |

The production code path is unmodified — only the HTTP shell and the Anthropic endpoint are substituted (via `ANTHROPIC_BASE_URL`, which the SDK honours). Streaming, progress milestones, `extractJSON`, and Zod validation all execute for real.

Run: `[VPS] cd /root/Plot-Twists && ANTHROPIC_API_KEY=sk-ant-harness-fake npx tsx scripts/harness/run.ts`

Result: **17 / 24 checks passed.** Full output in `AUDIT.md` per finding.

---

## 15. Limitations of this audit

Stated up front; every affected finding is marked with reduced confidence.

1. **No API keys on this host.** No `.env` exists. AI cost and latency figures are computed from measured token counts against published pricing, not from a live billed run.
2. **No successful iOS build.** Metal Toolchain absent; Mac data volume at 100%. Track 6 is source-inspection only.
3. **`next build` does not complete** without a Clerk publishable key, so no route-level bundle-size table was produced. Bundle figures are from the partial `.next` output.
4. **No Railway / App Store Connect / Firebase / Clerk console credentials.** External-system state (is the Railway project deleted or just unlinked? what is in App Store Connect?) is in `DECISIONS.md`, not asserted here.
5. **No mid-tier Android device.** Track 5 frame-rate claims would require throttled emulation, which was not run.
6. **The brief names Supabase; this stack uses Firestore.** The "RLS policies" track has no target. Firestore security rules were looked for and are not present in either repo — there is no `firestore.rules` file.

---
---

# APPENDIX C — `SESSION-2026-07-29-EVENING.md` (verbatim)

# Session report — 2026-07-29, evening

**Scope:** everything done since your instruction beginning *"Dev Clerk keys incoming"*, plus the
key paste that followed it.

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

---

## Bottom line

**PlotSlop is live on `https://plotslop.com` and a second client can join a room.**

Cutover steps 1–5 and 7 are applied. **Step 6 is yours and still blocking** — exact commands and
pass criteria in §7b. sang3r.com was verified up after every nginx reload.

Getting there took four attempts and turned up **three real bugs in `deploy.sh`**, none of which
had ever been hit because nothing had ever executed that path — and then, on the final check, **a
fourth bug in the harness that fabricated eight plausible regressions.** That last one is §9 and is
the most important thing in this document.

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

Verification: **suite 450/450 · harness 49/49 · tsc 0 errors.** Committed as `3a525195`, pushed,
no Vercel build triggered.

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

**Suite 450/450 (32 suites) · harness 49/49 · `tsc --noEmit` 0 errors.** Committed and pushed as
`3a525195`; the push triggered **no** Vercel deployment (0 commit statuses), so the suppression is
still holding.

---

## 9. The thing I nearly got wrong, and it is the most important item here

After the cutover I ran the harness as a final check and it came back **38/46, with eight
failures.** The eight were:

```
hostAbandon · emptyResults · voterDrop · rateLimit · identity · spectatorVote · aiFailure ×2
```

Every one of those is an original audit finding. Every one is fixed and was verified fixed. Eight
regressions appearing at once, immediately after a deploy, naming exactly the bugs this whole audit
has been about — that is a coherent, alarming, *reportable* story, and I was one step from telling
it to you.

It was false. All eight.

**What was actually happening.** `server/db/json.ts` resolved its data directory as
`<cwd>/data`, so the harness wrote to `/root/Plot-Twists/data` — shared with every previous harness
run and with any dev server. `loadRoomsFromFirestore()` runs at server startup, so each run began
by loading every room any earlier run had ever created. There were **961** of them. Three of the 49
checks never ran at all, because rooms wedged by earlier scenarios aborted them — which is why the
denominator was 46 rather than 49, the detail that made me look twice.

**Confirmed three ways, same commit, minutes apart:**

| Condition | Result |
|---|---|
| 961-room accumulated DB | **38/46** — eight "failures" naming the known bug list |
| empty DB | **49/49** |
| 961-room DB + the isolation fix | **49/49**, and the dev DB byte-identical afterwards |

**Fixed.** `json.ts` honours `PLOTSLOP_DATA_DIR` (default unchanged; production must never set it),
and the harness forces a fresh `mkdtemp` per run and removes it on exit — the same
forced-not-defaulted treatment already given to the fake API key and the mock base URL, for the
same reason.

**Why this is worth a section of its own.** This is the third instrument bug today and by far the
worst. The `max_tokens` floor failed a working product with an obviously silly message ("0
generation requests reached the model"). The systemd start-limiter showed me a stale error. This
one **fabricated a plausible narrative** — a gate that fails a working product is bad, but a gate
that fails it *by naming the bugs you already believe in* is worse, because it survives scrutiny.
Your standing rule is that a red needs a second mechanism before it becomes a finding, and this is
the clearest illustration of it I have hit: the only reason I checked was that a number moved for a
reason I could not explain, and I went looking rather than re-running until it looked right.

There is a live consequence for you: **anyone who ran that harness on this box in recent weeks was
reading a partly fabricated result.** If a past session reported harness failures in that list,
treat the number as unreliable and re-run against the fixed harness before acting on it.

---

## 8. State of the box

- `plotslop.service`: **active and enabled**, `Ready on http://0.0.0.0:3100`
- nginx: real TLS config live for plotslop.com + www, ACME location ahead of the 301 so renewal
  survives
- sang3r.com: **200**, verified after every reload
- certificate: valid for both names, expires **2026-10-27**, renewal dry-run passed this afternoon
- database: JSON adapter, `/srv/plotslop/data`, Firebase deliberately unset
- `/srv/plotslop`: synced, `plotslop:plotslop`

---

*End of handoff. Generated 2026-07-30 from HEAD `2b3ed527`.*
