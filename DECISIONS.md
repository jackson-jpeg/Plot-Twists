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
| **1. Catalog grammar** | The character slot is a TRAIT or FLAW, not a person — full definition below | A player types "Shrek" and bypasses it entirely |
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

### Layer 1, redefined — 2026-07-29

**The old definition of layer 1 was "252 named characters → archetypes". That definition is what let paraphrase ship as archetypes, and it is hereby replaced.**

It failed because "archetype" is a word you can satisfy by deleting a name. The first pass did exactly that and passed every check: 252 entries became things like *"A grumpy swamp ogre who just wants to be left alone"* and *"A noodle-shop panda who became a martial arts prodigy"*. No name anywhere, layer 3 clean on every line — and every single entry still an individually identifiable description of one protected character, with the catalog still ordered franchise by franchise in cast order, so the grouping identified even the entries that were individually deniable.

That is a worse artefact than the names were, in Jackson's own framing about the poster briefs: *exposure is what you did, intent is what you wrote down about doing it.* A description engineered to evoke a character without naming it is the second thing.

**Layer 1 is now defined structurally, so it cannot be satisfied by wording:**

1. **The character slot is a TRAIT or FLAW, never a person.** No job title, no species, no era, no silhouette. *"Insists nothing is wrong at increasing volume"*, not *"a grumpy swamp ogre"*. A trait is a way of being any player can put on; a person is somebody you can point at.
2. **No entry maps 1:1 to an identifiable character.** The binding constraint. Checked by a human — see the done-criterion below.
3. **No franchise-derived ordering.** File order is a seeded shuffle produced by `scripts/build-catalog.ts`; there is no hand-maintained order left to group. Gated by an adjacency test against the rate a random permutation of the same category distribution would produce — the old file ran **5.0× over chance**, the new file runs **0.98×**.
4. **The specificity budget moves to SETTING and SITUATION.** Not IP-constrained, and carrying almost none of the comedy before. This is where the game gets its particularity back.
5. **Genre and public domain are explicitly allowed and are not property.** Noir, Cold War, Western, Shakespeare, Greek myth, Grimm, Arthurian, Gothic, Dickens, Austen, Brontë. Settings only — see the conflict note.

**The done-criterion, because rules 1 and 2 need a human:**

> Take a random sample of 30 entries and name the character each one maps to. If you can name one, it fails.

Run 2026-07-29 against a deterministic random sample: **30/30 could not be named.** The one flagged as arguable was *"Is certain the room is a simulation and keeps testing it"* — genre-adjacent, but there is no single character whose defining trait that is. Kept, and flagged rather than quietly kept.

**Where rules 2 and 5 conflict, and how it was resolved.** A Holmes card or a Dracula card would be perfectly legal — both public domain — and would fail rule 2, because you can name them. So the trait deck contains no public-domain characters at all, and public domain enters only through settings, where what is evoked is a *scene* rather than a person: *A Detective's Sitting Room, Fog At The Window, Two Armchairs*. **This is an interpretation of two rules that pull against each other, not a rule that was given.** If named public-domain characters should be allowed back into the character slot, rule 2 needs an explicit exemption written into it.

**What the automated gates can and cannot do.** `__tests__/unit/lib/contentSource.test.ts` now reads **five files as TEXT** — the catalog, its generator, the type definitions, and both prompt files — because every other IP check in this repo inspects runtime values and structurally cannot see a comment or a prompt template. It checks grammar, ordering, franchise titles, and named entities. **It cannot check rule 2, and nothing can.** That is why the done-criterion is a human step and why it is written down here rather than left as a habit.

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

## ✅ 7. Firestore + Storage rules — CLOSED MOOT 2026-07-30

**Jackson, 2026-07-30: *"Firestore: no project exists. Close DECISIONS.md #7 as moot."*** Closed.
No project means no deployed rules to export, no collections to enumerate, and no disclosure
question. Everything below this block is retained as the record of what was checked and why it was
ranked first; none of it is outstanding.

**Two premises in the original text were already false before this closed, and both are corrected
rather than deleted** — because each was what ranked this item above everything else:

1. **"A client-reachable path to the same project, live right now."** `lib/firebase.ts` is
   imported by **nothing**: a search for it across `app/`, `components/`, `lib/`, `server/`,
   `stores/`, `contexts/` and `hooks/` returns no importer. It is dead code, and it additionally
   self-guards on `isFirebaseConfigured`, which is false while the env vars are unset. There was
   no live browser path even if a project had existed.
2. **The severity that followed from (1).** This was "the top open item" largely because it was
   believed to be exposed independently of the deploy. It was not.

**What remains true and still binds:** `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and
`FIREBASE_SERVICE_ACCOUNT_KEY` stay unset, the JSON adapter at `/srv/plotslop/data` is the
database on purpose, and `cutover.sh` still refuses to run if either is ever set. Closing this
decision does not relax that guard.

**Original text follows, for the record.**

**This was the top open item.** There is no `firestore.rules`, `storage.rules`, or `firebase.json` in either repo, so nobody has read the deployed rules. `firebase-admin` bypasses rules server-side, but `firebase` (client SDK) is a direct dependency and `lib/firebase.ts` initialises it in the browser — so there is a client-reachable path to the same project, live right now, independent of the deploy.

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

## 9. Does credit pricing cover inference cost? — CLOSED 2026-07-29

**Yes, on the web. No repricing.** Jackson's ruling, on measured numbers.

The original estimate was right and slightly low: **~$0.05–$0.07 per round** became a measured
$0.0531, then **$0.0407** after the length cap below.

**What one round actually costs**, measured through the production path against the live API
(`scripts/real-generation.ts`, raw data in `.real-generation.json`, list price $3/M in, $15/M out):

| call | in | out | cost |
|---|---:|---:|---:|
| script generation, 8-player ENSEMBLE | 4,377 | 1,532 | $0.0361 |
| director's review (fires every completed round) | 258 | 255 | $0.0046 |
| **round** | **4,635** | **1,787** | **$0.0407** |

A round is two API calls, not one. `generateDirectorsReview` fires after voting whenever a key is
present, and omitting it understates the round by 11%.

**Margin against `lib/credits.ts`.** One credit is one round (`deductCreditOrReject`).

| tier | list $/credit | via Stripe (2.9% + $0.30) | via Apple IAP (30%) |
|---|---:|---:|---:|
| Starter, $5 / 20 | $0.250 | $0.228 → **5.6×** | $0.175 → 4.3× |
| Party, $10 / 50 | $0.200 | $0.188 → **4.6×** | $0.140 → 3.4× |
| Pro, $50 / 300 | $0.167 | $0.161 → **4.0×** | $0.117 → 2.9× |
| Studio Head, $100 / 1000 | $0.100 | $0.097 → **2.4×** | $0.070 → **1.7×** |

Stripe's **$0.30 fixed fee** is why Starter is not the best tier despite the highest list price
per credit: it is 6% of a $5 purchase and 0.3% of a $100 one. A flat "~3%" would have overstated
Starter's net by 6%.

Every tier clears cost on the web. Nothing is priced below the ~$0.10 line the original entry
warned about — Studio Head sits exactly on it, and that is the tier to watch.

**Recorded, and this is the operative constraint: Studio Head is web/Stripe only.** At 1.7× on
observed mean cost it survives Apple's cut on paper, but the margin is thin enough that it is not
a business — a run of long scripts eats it, and the pre-cap measurements (2,704 output tokens)
would have put it at 1.2×. If Studio Head is ever offered through Apple IAP, that tier gets
re-run against fresh numbers before it ships. This is not a prohibition on iOS; it is a
prohibition on assuming this table still holds when the payment rail changes.

**Why this stopped being close.** The prompt asked for 30–40 lines and nothing enforced it;
scripts came back at 59–73. Output was 83% of round cost, so length *was* the unit economics.
Capped to 30–38 lines with a 2,600-token ceiling on 2026-07-29 (Jackson's target, not mine — I
had proposed 35–45, which is too long to perform). Three fresh generations came back at 38/38/38,
un-truncated: output fell 39%, and output's share of a round fell from 83% to 56%.

**Not in this table:** Gemini poster generation, hosting, Firestore. Hosting is now a fixed VPS
cost rather than per-round (#12). Posters are per-round and unmeasured — the one remaining hole,
and the reason "4.0×" is not the same claim as "profitable".

**Closed.** Gates nothing further.

### 🔴 REOPENED 2026-07-30 — the table above is stale by 37.6%, and its own escape clause fired

Every number in the margin table assumes **$0.0407 per round**. That was the 30–38 line era.
`#14` raised the band to **42–52** the same week and recorded the new per-round figure ($0.0550)
**without recomputing the tiers** — so the margins have been wrong in the written record since
the budget changed.

Re-measured 2026-07-30 through the production path, 6 generations plus the director's review
(`.ab-generation.json`, `.real-generation.json`):

| | in | out | cost |
|---|---:|---:|---:|
| script generation, 8-player ENSEMBLE | 4,911 | 2,443 | $0.0514 |
| director's review | 262 | 259 | $0.0047 |
| **round** | **5,173** | **2,702** | **$0.0560** |

| tier | net $/credit (Stripe) | was → now | net $/credit (Apple) | was → now |
|---|---:|---|---:|---|
| Starter, $5 / 20 | $0.228 | 5.6× → **4.1×** | $0.175 | 4.3× → 3.1× |
| Party, $10 / 50 | $0.188 | 4.6× → **3.4×** | $0.140 | 3.4× → 2.5× |
| Pro, $50 / 300 | $0.161 | 4.0× → **2.9×** | $0.117 | 2.9× → 2.1× |
| Studio Head, $100 / 1000 | $0.097 | 2.4× → **1.7×** | $0.070 | 1.7× → **1.25×** |

**Every tier still clears cost on the web.** Nothing here is an emergency. Two things are worth
saying anyway:

1. **This entry wrote its own tripwire and the tripwire did not fire.** It says: *"If Studio Head
   is ever offered through Apple IAP, that tier gets re-run against fresh numbers before it
   ships."* The numbers changed on 2026-07-30 and nobody re-ran anything, because the clause was
   written to trigger on a **payment-rail** change and what actually moved was **cost**. A
   condition that guards one input while the other one moves is not a guard.
2. **Studio Head via Apple IAP is 1.25×** — 20¢ of margin on a $100 purchase, before hosting,
   before posters, before support. That is the tier to price or drop, not to ship.

Still not in the table: Gemini poster generation (unmeasured), hosting (now a fixed VPS cost),
Firestore.

**Reopened as a watch item, not as a blocker.** It gates nothing before the playtest.

---

## ✅ 10. Should the copy commit to the joke, or stay earnest? — CLOSED 2026-07-30

**Jackson, 2026-07-30: *"your recommendation stands — commit to the bit in user-facing copy,
comedyPrompts.ts stays earnest."*** Closed, and applied in the Chunk 5 copy pass.

**What shipped under it:**

- **103 brand occurrences** swapped `Plot Twists` → `PlotSlop` across 45 files. The count is 103,
  not the 122 estimated here, because the estimate was taken before the docs were excluded.
- **The joke is carried by the description strings, not the name.** Root `description`, both OG
  and Twitter blocks, the PWA manifest description, the `/join`, `/explore` and `/profile` route
  descriptions, and the onboarding step. Title strings keep "improv", "comedy" and "party game"
  because they are the SEO surface and the bit does not need to cost the search terms.
- **`comedyPrompts.ts` was not touched.** Verified by diff, not by intention — it is craft
  instruction to the model and irony there degrades output.
- **`app/terms/TermsContent.tsx` refund line fixed in the same pass**, per the same instruction:
  it stated refunds as "Stripe or Apple App Store". iOS is host-only and no player buys through
  Apple (#12), so the Apple half was wrong. Removing it turned up **three more stale Apple/iOS
  claims on the legal pages** that were not in the original item — the Terms said the Service is
  "available via web browser and iOS app", and the Privacy Policy listed Apple as a payment
  processor and as a third party receiving data. All four now describe Stripe on the web only.

**Not renamed, deliberately:** `localStorage` keys (`plottwists_*`, `plot-twists-*`) and the
registered store identifiers (`com.plottwists.app`, `merchant.com.plottwists.app`,
`com.plottwists.credits.*`). See NEEDS-JACKSON.md for why each is a different kind of decision.

---

## 11. Should the harness stay?

`scripts/harness/` — 10 scenarios, 24 checks, currently 17 passing. It found five defects that code reading would not have confirmed.

**Recommendation: keep it, and make the 7 failures the acceptance criteria for Chunks 2–3.** It is the only test exercising `game.handler.ts` or `voting.handler.ts`, both at 0% coverage. Wire it into CI in Chunk 6.

**Blocked:** nothing. Already written and pushed.

---

## ✅ 12. Where the game ships — THE WEB, AND ONLY THE WEB

**Decided by Jackson, 2026-07-29. This is a product decision and it settles several open questions at once.**

> the game ships on the web. plotslop.com hosts the actual game — marketing page and product on the same domain. Players join in a phone browser with a room code, no install, ever. iOS unshelves later as a HOST/TV experience only and is never required for players.
>
> — Jackson, 2026-07-29

**What this means concretely:**

| | |
|---|---|
| **One domain** | `plotslop.com` serves the marketing page *and* the game. No app subdomain, no split origin. |
| **Player path** | Phone browser → room code → playing. No install, no account required to join, no store. |
| **iOS** | Unshelves later as a **host/TV** surface only. Never on the critical path for a player. |
| **Consequence** | The install experience is not a funnel step. Anything treating it as one is now wrong. |

### Audit against the current architecture

Asked for, and done. Three categories.

**Already correct — no work needed:**

- **The staged nginx config is exactly right and needs no change.** `deploy/nginx/plotslop.com.conf` proxies both `/` and `/socket.io/` to `127.0.0.1:3100` under one `server_name plotslop.com www.plotslop.com`. Marketing and product on one origin, as decided. The cutover does not need re-staging.
- **No auth gate on the join path.** There is no `middleware.ts`, and `app/join/page.tsx` requires no session. Anonymous browser join already works.
- **Room codes already work both ways.** `app/join/[code]` deep link *and* `?code=` query param are both wired.
- **Purchases branch correctly.** `PurchaseCreditsModal` calls `isIOSNative()` and routes to StoreKit on native or **Stripe embedded checkout** on web. This was flagged as a likely native-only assumption and checked; it is fine. The web has a real payment path.

**Contradicts the decision — needs your call:**

- **`InstallPrompt` renders globally from `app/layout.tsx:159`, so it fires on `/join`.** On iOS Safari it shows on a timer regardless of which page the player is on. Under "no install, ever", an install banner over the join flow interrupts the exact moment that must not be interrupted — a player who was handed a room code at a party. It is not wrong to offer PWA install to a *host*; it is wrong on the player's path. **Not changed, because which surfaces should still offer it is a UX decision.** See `NEEDS-JACKSON.md`.
- **`app/terms/TermsContent.tsx:76`** states the refund policy as "Stripe or Apple App Store". Accurate while an iOS player app exists; wrong the moment iOS is host-only and no player ever buys through Apple. Cosmetic, but it is a legal page. Folds naturally into the Chunk 5 copy pass.

**Implication worth stating plainly:**

- **`/root/PlotTwists-Native` is currently a complete player app** — lobby, selection, loading, performing, voting, results. Under this decision that is no longer what it is for; it becomes a host/TV surface, which is a re-scope rather than a rename, and most of those screens stop being needed. Nothing to do now (iOS is shelved), but the shelved thing is a different shape from the thing that comes back.
- **Monetisation centre of gravity moves to Stripe.** Apple IAP (`server/services/apple.service.ts`, `server/routes/apple.ts`, the StoreKit half of `lib/purchases.ts`) stops being the primary path. It is not dead — a host app can still sell — but it is no longer the one that has to work. Do not delete it; do stop treating it as the default.

**This decision does not unblock the deploy.** The cutover is still waiting on the three secrets, DNS, and the Firestore answer.

---

## ✅ 13. The ENSEMBLE seat cap — RAISED TO 8, 2026-07-30

**Jackson's ruling, verbatim:** *"SEAT CAP: raise ENSEMBLE to 8."*

**The question.** `MAX_PLAYERS.ENSEMBLE` was **6**, while the scope freeze lifts only when he has
*"played this with eight people who are not my friends."* The gate and the product disagreed, and
nothing in any document had connected them. Worse, the live host lobby rendered **`Max 8`** on the
same screen as a mode card reading **`3-6 performers`** — so the failure mode was concrete: read
"Max 8", invite eight, watch two of them get seated as spectators.

**Why 8 and not "change the freeze wording to 6".** Both were live options and the choice was his.
The case for 8: nothing mechanical resisted it — the floor, the line budget, the token ceiling,
card dealing, voting, results and progression were all confirmed untouched *before* the change —
and the UI already claimed it, so 8 was the number a host had been promised. The case for 6 was
that a 38-line script split eight ways gives each player under five lines. He chose 8 and set the
follow-up rule himself: *if the measurement comes in under 5 lines per player, raise the line
budget rather than lower the cap back.* It came in at **4.71**. See `NEEDS-JACKSON.md` item 1 —
a number is recommended there, not applied.

**What the decision obligated, all done in the same pass:**

1. **One definition.** `MAX_PLAYERS` and a new `MIN_PLAYERS` in `server/utils/constants.ts`;
   `lib/playerCounts.ts` derives every label. `matchmaking.service.ts` had kept its own private
   copy of the floor — now an alias.
2. **No literals anywhere.** Twelve sites across nine files. Three were not strings.
3. **A test that fails when the cap moves**, where previously nothing asserted it at all — plus a
   drift guard that reads the real UI source and fails if a bare count reappears. Verified by
   injecting the exact string that shipped (`'1-6 Players'`) and confirming it goes red.
4. **Spectators named rather than implied.** The overflow joiner was always told; the **host** was
   not — the cast list counted spectators as performers. There is now an **Audience (N)** group.
5. **Both playtest artefacts re-run at 8** against the live API.

**The durable rule this leaves behind:** a seat count that appears in user-facing copy is derived
from `MAX_PLAYERS`/`MIN_PLAYERS`, never typed. The cap and the copy disagreed *in the deployed
bundle* precisely because three people had typed three different numbers in three files, and
changing the constant turned nothing red.

---

## #14 — Script length 42–52, and a script's cast is now the people in the room

**Decided by Jackson, 2026-07-30 evening. Applied the same evening.**

> *"Line budget: apply 42-52, max_tokens 2,600 → 3,000. Approved. Also apply the per-character
> instruction now — don't wait for the playtest. The skew is already measured… I'd be spending
> eight real people to confirm what three generations showed."*

Three rulings in one, and the third is the reason the other two were worth making.

**1. The band, 30–38 → 42–52.** This is not a reversal of #13's 30–38; that was decided against a
six-seat room and this against an eight-seat one. What changed underneath is the seat cap. Jackson
set the trigger in advance — *"if it's under 5, the fix is raising the line budget, NOT lowering
the cap back"* — and it fired at a measured 4.71. The band **widens** rather than shifts because
the skew, not the total, was the finding: a narrow band is what forced the model to pay for an
extra character by starving three others.

**2. A floor, not a ration.** *"No speaker below 3."* The prompt states the floor and states just
as loudly that it is **not** an instruction to divide the lines evenly — Jackson named the failure
mode in advance (*"scenes get stiff or evenly boring"*) and a model in a hurry reads "everyone gets
at least 3" as "give everyone the same". Measured after: floor 4, busiest seat 12. The lead
survived.

**3. Exactly the seated cast — which turned out to be a bigger thing than it looked.** The ask was
about a ninth invented part being a part nobody reads. The truth was that **no part was ever read
by anybody**: `speaker` was an invented first name, a player's identity is their verbatim trait
card, and the teleprompter binds the two with `===`. Zero matches in three of three scripts. So
"exactly the seated cast" is now enforced as *the speaker field literally is the trait string*,
which is what makes YOUR TURN work at all. See `HANDOFF.md` §14.

**What it cost, and it is more than was forecast.** $0.0400 → **$0.0550** per round (+37.5%,
against a forecast of +15%). Roughly half is the cast list on input and half is a 50-character
speaker label on every output line. $9 buys ~164 rounds rather than ~225. Jackson approved a
budget change and got a budget change plus a correctness change; the cost of the second was not in
the number he approved, and he is told so plainly rather than having it averaged in.

**The visible consequence, not changed:** speaker labels on the teleprompter are now sentences
rather than names. Legible, uglier, and a design call that is his.

---

## ✅ #15 — The homepage poster wall: delete the image slots, do not generate posters

**Decided 2026-07-30 (late). Jackson's instruction: *"Either generate non-infringing posters
through the existing image pipeline for the six featured entries, or restyle the cards so they
don't have image slots at all. Tell me which is cheaper before you do it."***

**Chosen: restyle. No artwork, and no artwork pipeline behind these cards.**

The dollar comparison is not close but it is also not the reason. Six Gemini images would have
cost ~$0.24. The costs that decided it:

| | generate | restyle |
|---|---|---|
| Rewrite `scripts/generate-homepage-posters.ts` + six briefs (both deleted in 4a) | yes | no |
| New IP surface needing a human judgement call | **yes — six images, Jackson's call** | no |
| Repo weight | ~11 MB | 0 |
| Survives Chunk 7's redesign | probably not | n/a |
| Items added to Jackson's queue | 1 | 0 |

**The deciding factor: the six archetype titles map one-to-one onto the characters Chunk 4a
removed.** Any brief detailed enough to produce a good poster is a brief that has to be defended,
and 4a's whole finding was that the briefs were worse than the images because they were evidence of
intent. Generating artwork would re-open, three days later, the exact question 4a closed.

`imagePath` was **deleted from the interface** rather than left optional-and-unset. An unset
optional reads as "artwork is coming"; it is not, and the next person to read the file should not
have to work that out. See `HANDOFF.md` §16.

**Not decided here:** anything else about the homepage. The design pass is Chunk 7, after the
playtest, logged in `BACKLOG.md` with Jackson's four findings and one more found while doing this.
