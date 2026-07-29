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
