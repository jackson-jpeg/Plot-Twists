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

## 5. Redeploy target — Railway, Vercel, or this VPS?

**Recommendation: Railway.** It is what the code is written for (custom `server.ts` running Next.js + Express + Socket.IO in one process), it is already configured, and it is one env var away from working. Vercel's serverless model **cannot** host a long-lived Socket.IO server without splitting the game server out.

**Whichever you pick: pin to one replica.** All game state is process-local with no Socket.IO adapter — two instances means two players in the same room can land on different processes and never see each other.

**Blocked:** Chunk 1 completion. Everything I can do without credentials is done.

---

## 6. Is the Railway project deleted, or just unlinked?

`web-production-c7981.up.railway.app` returns `Application not found`.

**Since the audit I have found the likely cause and fixed it.** `next build` was failing on `@clerk/clerk-react: Missing publishableKey`, and `nixpacks.toml` passed six `NEXT_PUBLIC_FIREBASE_*` variables at build time and **no Clerk variable**. Both are now fixed (`nixpacks.toml` + `force-dynamic` on the affected pages).

**What I still need from you:** open the Railway dashboard, confirm whether the project exists, and if it does, grab the last build log. If it shows that Clerk error, this is already solved and you just need to redeploy. You will also need to set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the Railway environment — the `nixpacks.toml` change references it but cannot supply it.

**Blocked:** Chunk 1 completion.

---

## 7. What are the deployed Firestore security rules?

There is no `firestore.rules` or `firebase.json` in either repo. The server uses `firebase-admin` (which bypasses rules), but `firebase` (the client SDK) is also a direct dependency and `lib/firebase.ts` exists — so there is a client-side path to the same project.

If the deployed rules are the `firebase init` 30-day open default, every game record, player stat, and user profile is world-readable. **The database is reachable whether or not the app is deployed**, so this does not wait for Chunk 1.

**What I need:** export the current rules from the Firebase console. I will commit them and wire them into the deploy.

**Blocked:** nothing formally — but I would not put the app back online without knowing.

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
