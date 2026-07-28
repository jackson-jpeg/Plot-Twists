# DECISIONS — PlotSlop

Decision queue from the 2026-07-28 adversarial audit.
**Updated 2026-07-28 with Jackson's rulings.** Resolved items are kept with their reasoning so they are not re-litigated.

---

## 🔒 STANDING RULE — SCOPE FREEZE

> No new features until chunks 1–4 ship and I have played this with eight people who are not my friends. Referrals, weekly challenges, and tvOS were built while the deployment was dead and the suite was red since April. If I ask you for feature work before that playtest, refuse and quote this paragraph back at me. That includes anything I frame as "quick" or "while we're in here."
>
> — Jackson, 2026-07-28

This binds for the rest of the project. Parked ideas go to `BACKLOG.md`, which is not touched until the playtest has happened.

**Also standing:** iOS is shelved. No rename of its 349 occurrences, no bundle-ID decision, tvOS target kept. No chunk time spent on it.

---

# RESOLVED

## ✅ 1. `plot-twists.com` — LET IT DROP

**Decided:** let the Aug 1, 2026 restore deadline pass.

**Conditional check requested:** *"confirm no still-installable TestFlight build resolves that host. If a shipped binary phones home to it, an expired domain becomes an attacker-controlled endpoint pointed at my users and I'll pay to hold it."*

**Check performed 2026-07-28. Result: no installable build exists. Let it drop.**

Evidence, strongest first:

| # | Check | Result |
|---|---|---|
| 1 | App Store lookup by bundle ID (`itunes.apple.com/lookup?bundleId=com.plottwists.app`) | **resultCount 0** — never published |
| 2 | Xcode Archives on the build Mac | **No PlotTwists `.xcarchive`.** Only `LeftSaid` (×3) and `ScreenReceipts`, from 2026-07-24 and 2026-07-26. An archive is a hard prerequisite for any TestFlight upload, and Xcode retains them indefinitely by default |
| 3 | `fastlane` / `Appfile` / `Deliverfile` anywhere in the repo | None |
| 4 | TestFlight build expiry | Builds expire **90 days** after upload. The project has been `status: deprecated` in `ios-toolkit/config/projects.yml` since **2026-04-05** — 114 days ago. Any build predating that has already expired |

Point 4 is decisive on its own: even if an upload happened and its archive was later deleted, the install window closed months ago.

**What the exposure would have been, for the record.** The app does **not** phone home to `plot-twists.com` — `Config.swift:30` points at Railway. The domain matters for three entitlements:

```
PlotTwists/iOS/PlotTwists.entitlements:13   applinks:plot-twists.com
PlotTwists/iOS/PlotTwists.entitlements:14   applinks:www.plot-twists.com
PlotTwists/iOS/PlotTwists.entitlements:15   webcredentials:clerk.plot-twists.com
```

Line 15 is the one that would have mattered — a **Clerk auth subdomain** associated for Password AutoFill. An attacker registering the expired domain would control the authentication domain the app shares credentials with. That is a genuinely serious vector *if a build were installed*. It is not, so it does not apply.

**When iOS comes off the shelf**, these three entitlements get repointed at `plotslop.com` before any build ships. Noted in `BACKLOG.md`.

---

## ✅ 3. PLOTSLOP trademark — CLEAN, DO NOT RE-RAISE

**Decided:** clean, proceed.

Jackson's checks: Justia's trademark index returns nothing for PLOTSLOP or PLOT SLOP, and the `.com` was unregistered — which nobody with a mark in commerce allows.

My checks, 2026-07-28: iTunes Search API returned 10 results for `plotslop`, none an exact match (all fuzzy hits on "plot"). Web search found no matching trademark, app, game, or domain.

**Recorded caveat:** a filing from the last few weeks may not yet be indexed in any of these sources. Accepted.

**This item is closed. Do not raise it again.**

---

## ✅ 4. Content strategy — THREE LAYERS, SHIPPED TOGETHER

**Decided, and the framing was corrected.** My original write-up treated the catalog rewrite as the IP fix. That was wrong, and the correction matters enough to record verbatim:

> Card text is never validated against the catalog and reaches the Claude prompt verbatim. That means rewriting 252 named characters into archetypes does not actually stop Shrek from reaching the model — a player types "Shrek" and the rewrite is cosmetic. The IP fix is not the catalog rewrite. It is three layers, and shipping any one alone is theater.
>
> — Jackson, 2026-07-28

**The three layers:**

| Layer | What | Why it fails alone |
|---|---|---|
| **1. Catalog rewrite** | 252 named characters → archetypes, server-side source of truth | A player types "Shrek" and bypasses it entirely |
| **2. Server-side validation** | Submitted card **IDs** resolve against the catalog. Free text never interpolated into a system prompt | Without layer 1 it validates against a library full of owned IP |
| **3. Output screening** | Generated content screened for named real people and owned franchises | Without 1 and 2 it is the only thing standing between a player's input and the screen |

**IP is not marked resolved until all three land.** They ship as one unit — see `CHUNKS.md` Chunk 4.

Note the layer-2 refinement: validation is on **card IDs**, not on string equality. The client submits an ID from its dealt hand; the server resolves it against the catalog and uses the *catalog's* text. Player free text never reaches the prompt at all, which is stronger than sanitising it.

**Split out and done first, separately:** `lib/homepagePosterBriefs.ts`.

> Written instructions to reproduce Shrek's character design is the single worst artifact in the repo and it is evidence of intent, not just exposure.
>
> — Jackson, 2026-07-28

Agreed, and it is worth being precise about why: the file does not merely name Shrek, it specifies how to render him — *"broad ogre silhouette, expressive animated face, textured green skin… Do not make Shrek photorealistic."* In an infringement analysis, exposure is what you did; intent is what you wrote down about doing it. This is the latter. It is deleted first, on its own commit, ahead of the rest of Chunk 4.

**Options B (user-supplied names, client-side only) and C (public-domain pack) are parked** in `BACKLOG.md`. Option A is the base library.

---

## ✅ 8. Mascot — DO NOT BUILD

**Decided:** stop. Moved to `BACKLOG.md`, untouched until after the playtest.

> Zero matches in both codebases resolves Track 8 by deletion. Building it now is exactly the behavior your uncomfortable answer diagnosed.
>
> — Jackson, 2026-07-28

---

## ✅ 2. iOS bundle IDs — DEFERRED BY NOT RENAMING

**Decided:** iOS shelved. No rename, no bundle-ID decision, tvOS target kept.

The question — whether `com.plottwists.app` has ever been submitted to App Store Connect — is now also **answered as a side effect of the #1 check above: it has not.** It is not on the App Store and there is no archive on the build machine.

So if and when iOS comes off the shelf, changing all four bundle IDs is **free**. The one-way door has not been walked through. Recorded in `BACKLOG.md` so the finding is not lost.

---

# OPEN

**Reordered by risk on Jackson's instruction, 2026-07-28.** Firestore rules first:

> "The database is reachable whether or not the app is" means production data is exposed right now under rules neither of us has read, and that is true whether or not I ever fix the deploy.

Order: **7 (rules) → 5/6 (Railway) → DNS.**

---

## 🔴 7. Firestore + Storage rules — EXPORT THESE FIRST

**This is the top open item.** There is no `firestore.rules`, `storage.rules`, or `firebase.json` in either repo, so nobody has read the deployed rules. `firebase-admin` bypasses rules server-side, but `firebase` (client SDK) is a direct dependency and `lib/firebase.ts` initialises it in the browser — so there is a client-reachable path to the same project, live right now, independent of the deploy.

### How to export — the honest answer

**There is no CLI command that fetches rules.** I verified this rather than guessing:

```
[VPS] npx firebase-tools@latest firestore --help
→ firestore:delete, firestore:bulkdelete, firestore:indexes,
  firestore:locations, firestore:operations, firestore:databases, firestore:backups
```

No `rules` subcommand. The CLI can only *deploy* rules, not retrieve them. There is also no Firebase CLI or `gcloud` installed on either machine, and no Firebase project ID anywhere in either repo (only `your-project.appspot.com` placeholders).

**So it's the console. `[MACBOOK]` — or any browser you're signed into Firebase with. ~60 seconds:**

1. https://console.firebase.google.com → select the project
2. **Firestore Database → Rules** tab → select all → paste into a file
3. **Storage → Rules** tab → same
4. Send me both, plus the **project ID** (it's in the console URL: `/project/<PROJECT_ID>/overview`)

Send them however is easiest — paste them straight into chat is fine, rules are not secrets.

### What I'll do with them

Per your instruction — *"assume each one is wrong until a test proves otherwise, same standard as the harness, not a read-through"* — I will not eyeball them. Plan:

1. Commit them as `firestore.rules` / `storage.rules` + a `firebase.json` so they are version-controlled and deployable.
2. Stand up `@firebase/rules-unit-testing` against the Firestore emulator `[VPS]` — same red/green discipline as the socket harness.
3. Write a **deny-by-default** test matrix: for every collection the server touches (`gameHistory`, `playerStats`, `progression`, `users`, `rooms`, `cardPacks`, …), assert that an **unauthenticated** client and a **wrong-user authenticated** client can neither read nor write. Each assertion must fail against a permissive rule before it passes against a correct one.
4. Report as `N/M` alongside the socket harness.

If the deployed rules turn out to be the `firebase init` 30-day open default, that is an S1 and it jumps ahead of everything else in Chunk 2.

**Blocked:** nothing waits on this — but I would not put the app back online without it, and it is exposed right now regardless.

### 7b. "I wouldn't care if we bailed on Firebase too" — this is viable, and it changes #7

Jackson floated this 2026-07-28. Investigated rather than acted on. **It is a real option and it is cheaper than it sounds.**

Firebase does exactly three jobs here:

| Job | Replacement | Cost |
|---|---|---|
| **Firestore (database)** | The JSON adapter **already exists and already works** — it ran this entire audit's harness. It implements the full `DatabaseAdapter` interface including `runTransaction`. And `server/db/index.ts:12-15` **already auto-falls-back to it** when `FIREBASE_SERVICE_ACCOUNT_KEY` / `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are absent. | **Zero code change — just don't set the env vars** |
| **Storage** (poster images → `storage.googleapis.com`) | Local disk + nginx static serving. `image.service.ts:116-134` is the only consumer. | ~3h |
| **FCM push** (`push.service.ts:33`) | No drop-in. But push is only used for `pushOnStateChange` host notifications — not the core loop. | Goes dark until replaced |

**Two caveats I am not going to soften:**

1. **The JSON adapter's `runTransaction` is a process-local promise lock**, not a real transaction — `server/db/json.ts:17` says "dev-only adapter". That is *sufficient* here only because the deploy is pinned to one replica anyway (game state is process-local). If you ever run two, credit deduction can double-spend. Postgres is already running on this box at `127.0.0.1:5432` if you want to do it properly later.
2. **Bailing does not delete this decision item.** New data would go to JSON, but the *existing* Firestore project still holds whatever it holds, still under rules nobody has read. So #7 becomes simpler, not moot: **lock down or delete the old Firebase project.** That is a console action, and it stops being deploy-blocking.

**Recommendation: bail on Firestore, keep the decision on Storage/push for later.** Deploy with no Firebase env vars set — the JSON adapter picks it up with zero code change, on a VPS with a persistent disk. Then either delete the old Firebase project outright (cleanest — kills the exposure) or export its rules per #7 above if there is data in it worth keeping. **Tell me which, and whether there is anything in that project you care about.**

---

## ✅ 5. Redeploy target — THIS VPS (Railway is out)

**Railway free trial ended (Jackson, 2026-07-28). Recommendation: host it on this VPS.** Not a compromise — it is a better fit than Railway was, for concrete reasons:

| | Evidence |
|---|---|
| WebSocket proxying already solved | `/etc/nginx/sites-enabled/sang3r.com` already carries the exact headers Socket.IO needs: `proxy_set_header Upgrade $http_upgrade`, `Connection "upgrade"`, `proxy_buffering off`, `proxy_read_timeout 600s`. Copy it. |
| The service pattern exists | `sanger-next.service` runs a Next.js prod server on port 3000 with `Restart=always` and memory caps. Same shape. |
| **Persistent disk** | The JSON db adapter writes to `data/*.json`. On Railway's ephemeral filesystem that silently loses everything on redeploy. On the VPS it survives. **Railway was actively worse for this.** |
| Single replica is required anyway | All game state is process-local with no Socket.IO adapter, so horizontal scale was never available. The VPS's single-box nature costs nothing. |
| Postgres already running | `127.0.0.1:5432`, active — available if the JSON adapter is outgrown. |
| Cost | Already paid for. |

**Vercel remains wrong** regardless of Railway: its serverless model cannot host a long-lived Socket.IO server without splitting the game server out.

**What I need from you:** point `plotslop.com` at `187.77.218.14` in Hostinger DNS (it currently resolves to `2.57.91.91`, the Hostinger parked-page host). I can do nginx, systemd, and TLS from here.

**Still blocked on secrets:** `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. Nothing deploys without those three.

---

## ✅ 6. (moot) Is the Railway project deleted or unlinked?

`web-production-c7981.up.railway.app` returns `Application not found`.

**Since the audit I have found the likely cause and fixed it.** `next build` was failing on `@clerk/clerk-react: Missing publishableKey`, and `nixpacks.toml` passed six `NEXT_PUBLIC_FIREBASE_*` variables at build time and **no Clerk variable**. Both are now fixed (`nixpacks.toml` + `force-dynamic` on the affected pages).

**What I still need from you:** open the Railway dashboard, confirm whether the project exists, and if it does, grab the last build log. If it shows that Clerk error, this is already solved and you just need to redeploy. You will also need to set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the Railway environment — the `nixpacks.toml` change references it but cannot supply it.

**Blocked:** Chunk 1 completion.

---

## 9. Does credit pricing cover inference cost?

Measured: 2,985 input tokens per script generation (real, read off the wire). Estimated output 2,000–3,000. At Sonnet-tier rates, **~$0.05–$0.07 per round** plus Gemini poster generation.

Generation is credit-gated (`server/socket/helpers.ts:74-104`) — authenticated host, one credit deducted, guests rejected in production. So cost is bounded by credits sold. **What I need:** what one credit costs, and how many credits a game consumes.

A credit priced below ~$0.10 loses money on every game before Gemini, Firestore, hosting, and Stripe's cut.

**Blocked:** nothing technical. Gates any growth spending.

---

## 10. Should the copy commit to the joke, or stay earnest?

Affects ~122 `Plot Twists` copy occurrences during the rename.

**Recommendation: commit to the bit in user-facing copy only — not in the system prompt.** `comedyPrompts.ts` is craft instruction to the model; making it ironic will measurably degrade output. Rewrite the UI strings, manifest description, and store copy; leave the prompt earnest.

**Blocked:** the copy pass in Chunk 5. The mechanical rename is unaffected.

---

## 11. Should the harness stay?

`scripts/harness/` — 10 scenarios, 24 checks, currently 17 passing. It found five defects that code reading would not have confirmed.

**Recommendation: keep it, and make the 7 failures the acceptance criteria for Chunks 2–3.** It is the only test exercising `game.handler.ts` or `voting.handler.ts`, both at 0% coverage. Wire it into CI in Chunk 6.

**Blocked:** nothing. Already written and pushed.
