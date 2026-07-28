# DECISIONS — PlotSlop

Every question I have for you, in one queue. Nothing here was asked mid-audit.

Ordered: irreversible and time-critical first, then blocking, then the rest.
Each item states my recommendation. None of them is a neutral menu.

---

## ⏰ 1. Restore `plot-twists.com`, or let it drop? — **DEADLINE: Aug 1, 2026 (4 days)**

**The decision:** Pay the restore fee to reclaim the lapsed domain purely as a 301 and defensive hold, or let it expire permanently.

| Option | Real tradeoff |
|---|---|
| **Let it drop (recommended)** | You lose nothing measurable. The domain has no DNS record and the backend behind it 404s — it has been dark long enough to be de-indexed, so there is no search equity and no live inbound traffic to redirect. The only hard references are your own: the iOS entitlements (an app that cannot build and points at a dead server) and the AASA file, both of which move to the new domain anyway. |
| **Restore for a 301** | Buys an option. If any inbound link exists that I did not find, it keeps working. Costs the restore fee — which for a lapsed domain is typically 3–10× the renewal — plus one DNS record you never think about again. |

**Recommendation: let it drop.** Beyond the empty search-equity case, the defensive argument actively cuts the other way: you are renaming *because* "Plot Twists" collides with a pending USPTO Class 028 filing, a live Class 041 registration (Reg. 4950750), two App Store apps, a Steam title, and a studio. Holding a domain matching a mark you have decided not to use protects nothing and sits adjacent to an active registrant's rights. Walk away cleanly.

**Override condition:** if the restore fee is under ~$150 and buying certainty is worth that to you, restore it, park a 301, and move on. Do not spend more than ten minutes on this.

**Blocked until you decide:** nothing — but the option expires. **Decide by July 31.**

**Reversible:** No. After the deadline the domain drops and anyone can register it.

---

## 🔒 2. Has `com.plottwists.app` ever been submitted to App Store Connect?

**The decision:** Whether to change the iOS bundle IDs during the rename.

I cannot determine this from the audit host — no App Store Connect access. The answer changes the cost by an order of magnitude:

| If… | Then |
|---|---|
| **Never submitted** | Change all four bundle IDs now (`com.plottwists.app`, `.app.widgets`, `.tv`, `.tests` → `com.plotslop.*`). Costs nothing. Do it when you next touch the iOS project. |
| **Submitted or in TestFlight** | The bundle ID is permanent. Changing it means a **new App Store listing** — zero reviews, zero ranking, zero download history, and no upgrade path for anyone with the old app installed. You would be choosing to abandon the identity. |

**Recommendation: defer this decision entirely, and do not rename the iOS app in this migration.** Per Track 6, the iOS app cannot build (missing Metal Toolchain, Mac at 100% disk), points at a dead Railway URL, and is already marked `status: deprecated` in your own `ios-toolkit` registry as of 2026-04-05. Renaming 349 occurrences and walking through a one-way door for an app you are not shipping is pure cost. Leave it on `master`, unrenamed, and decide when you actually ship iOS.

**Blocked until you decide:** only iOS rename work — which I am recommending you not do. Nothing on the web critical path.

**Reversible:** The *decision* is reversible; the bundle ID change is not, once submitted.

---

## 🔒 3. Run a real USPTO search on "PLOTSLOP" before sinking migration effort in

**The decision:** Do the trademark clearance properly, or accept the risk.

**What I did:** iTunes Search API (10 results, no exact match), two web searches (nothing). **What I could not do:** query the actual USPTO register. `tmsearch.uspto.gov` is a JS application that does not respond to a plain fetch, and `trademarks.justia.com` returned HTTP 403.

**The absence of web-search results is weak evidence.** Plenty of live registrations have no search footprint.

**Recommendation: spend ten minutes at `tmsearch.uspto.gov` yourself, searching PLOTSLOP and PLOT SLOP in Classes 009, 028, 041, and 042, before Chunk 5 (the rename).** The entire reason this migration exists is a trademark collision that was not caught the first time. Repeating that mistake is the one failure mode you have already paid for once. Also check Google Play and Steam directly.

If it comes back clean — which I expect — this closes. If it does not, that is an S1 and the rename target changes before you spend any effort.

**Blocked until you decide:** Chunk 5 (rename execution). Chunks 1–4 are unaffected and should proceed regardless.

**Reversible:** Yes, but the cost of being wrong rises with every hour of migration work.

---

## 4. Which content strategy replaces the named-IP library?

**The decision:** How to de-risk 252 named characters across 114 owned franchises, plus one named living person (`lib/content.ts:340`, Jerry Seinfeld).

| Option | Cost | Residual risk | Effect on the game |
|---|---|---|---|
| **A — Archetype prompts** | ~2 days (LLM-assisted rewrite + human review), plus regenerating 6 poster assets | **Low** — archetypes are not protectable | Minimal. "A grumpy swamp ogre who just wants to be left alone" plays the same and arguably frees the AI to invent rather than impersonate |
| **B — User-supplied names, client-side only** | ~2 days, mostly a persistence audit (`gameHistory.service.ts` currently persists everything) | Medium — you are still transmitting it to a model | Gives players back the exact joke and moves authorship to them |
| **C — Public domain + licensed pools** | ~1 day for a starter pool | Very low | Library shrinks hard and skews old — Sherlock, Dracula, Oz, Greek myth |
| **Do nothing** | 0 | **S1** — App Store 5.2, trademark, right of publicity | — |

**Recommendation: A as the default library, B as an opt-in feature, C as a labelled flavour pack.**

A alone removes essentially all the exposure while keeping the game intact — the comedy in a mashup comes from collision of register, not from the trademark. B is a strong complement because it hands the player back the joke you removed. C is a nice-to-have, not a base.

Do **A first and alone** (Chunk 4). It is the S1 fix. B and C can wait until you know people play this.

**Note:** A is worthless without the Chunk 2 card-validation fix. Right now `validateCardSelection` accepts any string, so a client can post "Shrek" regardless of what is in `lib/content.ts`. **Sanitising the library without validating submissions accomplishes nothing.**

**Blocked until you decide:** Chunk 4.

**Reversible:** Yes.

---

## 5. Redeploy target — Railway, Vercel, or this VPS?

**The decision:** Where the web app + Socket.IO server lives.

Both configs exist in the repo (`railway.json`, `vercel.json`) and the Railway app is currently deleted or unlinked (`{"code":404,"message":"Application not found"}`).

| Option | Tradeoff |
|---|---|
| **Railway (recommended)** | Already configured. Runs the custom `server.ts` (Next.js + Express + Socket.IO in one process), which is what this architecture requires. Long-lived WebSocket connections are the whole product. ~$20–50/mo at 1k MAU. |
| **Vercel** | `vercel.json` exists but **Vercel's serverless model cannot host a long-lived Socket.IO server**. You would need to split the game server out. Real work, no benefit at this stage. |
| **This VPS** | You already run nginx and 10 sites here. Cheapest, full control, and `plotslop.com` already points at `2.57.91.91`. Adds you as the ops burden. |

**Recommendation: Railway.** It is what the code is written for, it is already configured, and it is one env-var fix away from working. The VPS is a reasonable fallback if Railway costs annoy you later.

**Whichever you pick:** pin it to **one replica**. Per Track 2, all game state lives in process-local `Map`s with no Socket.IO adapter — two instances means two players in the same room can land on different processes and never see each other.

**Blocked until you decide:** Chunk 1.

**Reversible:** Yes, easily.

---

## 6. Is the Railway project deleted, or just unlinked?

**The decision:** Whether Chunk 1 is "redeploy" or "recreate from scratch."

`web-production-c7981.up.railway.app` returns `Application not found`, which could mean the project was deleted, the service was removed, or the domain was detached. I cannot tell from outside.

**What I need from you:** open the Railway dashboard and tell me which. If the project still exists, also grab the last build log — my strong hypothesis (Track 5) is that it failed on the same `next build` error I reproduced locally (`@clerk/clerk-react: Missing publishableKey`), because `nixpacks.toml` passes six `NEXT_PUBLIC_FIREBASE_*` variables at build time and **no Clerk variable**.

**Recommendation:** Check before Chunk 1. If the build log shows that error, the fix is a one-line addition to `nixpacks.toml` and you are back online in an hour.

**Blocked until you decide:** Chunk 1 (which path it takes — not whether it happens).

**Reversible:** N/A — diagnostic.

---

## 7. What are the deployed Firestore security rules?

**The decision:** Whether there is an open-database problem hiding behind the deployment problem.

**There is no `firestore.rules` file in either repo**, and no `firebase.json`. The server uses `firebase-admin`, which bypasses rules entirely — but `firebase` (the client SDK) is also a direct dependency and `lib/firebase.ts` exists, so a client-side path to the same project is present.

| If the deployed rules are… | Then |
|---|---|
| `allow read, write: if false` (locked) | Fine. Export them and commit them so they stay that way. |
| The `firebase init` 30-day open default | **Every game record, player stat, and user profile is world-readable.** That is an S1 you cannot see from the repo. |

**Recommendation: check this during Chunk 1, before you put the app back online.** Export the current rules from the Firebase console, commit them to the repo, and add them to the deploy. ~2 hours once you have console access. Do not skip it because the deployment is broken — the database is reachable whether or not the app is.

**Blocked until you decide:** nothing formally, but it gates whether Chunk 1 is safe to complete.

**Reversible:** Yes.

---

## 8. Build a mascot, or ship without one?

**The decision:** Whether "Reely" (or a successor) is on the roadmap at all.

**Context that changes this question completely: Reely does not exist.** `grep -rn -i "reely"` returns zero matches in both codebases. There are no assets, no component, no states, no animations. The re-skin-vs-rebuild tradeoff the brief assumes does not exist — every path is a build from zero.

| Option | Cost |
|---|---|
| **Ship no mascot (recommended)** | **0.** Wordmark plus the existing stage language — film-strip sprockets, clapperboard stripes, chase lights, curtains, spotlights — which is already built and coherent |
| Build a projector mascot | 3–5 designer-days |
| Build a slop-native mascot | 3–5 designer-days |

**Recommendation: ship without one, and if you build one later, do not build a projector.**

The cinema *staging* language is built, works, and survives the rename fine — a variety show and a slop bucket sit together comfortably in a late-night-TV register. Keep the stage. But a one-eyed projector is a fine mascot for a cinema app and a wasted one for a self-aware AI-slop joke; it would earnestly represent the exact thing the name is winking at. If you build a mascot later, build something that leans into the mess.

The strongest argument is that this is entirely deferrable. It blocks nothing.

**Blocked until you decide:** nothing.

**Reversible:** Yes.

---

## 9. Does credit pricing cover inference cost?

**The decision:** Unit economics. I cannot compute this without seeing your pricing.

**What I measured:** 2,985 input tokens per script generation (real, read off the wire). Estimated output 2,000–3,000 tokens. At Sonnet-tier rates that is **~$0.05–$0.07 per round**, plus Gemini poster generation billed separately.

**The good news:** generation is credit-gated — `server/socket/helpers.ts:74-104` requires an authenticated `hostUid` and deducts a credit, rejecting guests in production. So inference cost is bounded by credits sold, not by traffic. That is the correct architecture and it is already built.

**What I need from you:** what does one credit cost, and how many credits does a game consume? One credit per script generation, per `deductCreditOrReject`.

**Recommendation:** Work this out before you promote the app anywhere. A credit priced below ~$0.10 loses money on every game before you count Gemini, Firestore, hosting, or Stripe's cut. This is cheap to get right now and expensive to change after people have bought credits.

**Blocked until you decide:** nothing technical. It gates any growth spending.

**Reversible:** Prices are reversible; refunding people who bought at the old price is not.

---

## 10. Do you want the copy to commit to the joke, or stay earnest?

**The decision:** A voice question that affects ~122 `Plot Twists` copy occurrences during the rename.

The existing copy is sincere cinema: "AI Improv Comedy Game", system-prompt sections headed "YOUR MISSION" and "WHAT KILLS COMEDY", earnest loading states. "PlotSlop" is a self-aware AI-slop joke. Sitting one on top of the other reads as a name that lost an argument with its own product.

| Option | Effect |
|---|---|
| **Commit to the bit** | Rewrite user-facing copy to match the name's irony. More work, coherent result, and it is a differentiator in a category full of earnest AI products |
| **Keep it earnest** | Name is the only wink; everything else plays straight. Less work. Some tension, but it reads as a product with a funny name rather than a confused one |
| **Do neither** | The current default, and the actual failure mode |

**Recommendation: commit to the bit, but only in user-facing copy — not in the system prompt.** The system prompt is craft instruction to the model and should stay earnest; making *it* ironic will measurably degrade output. Rewrite the ~122 UI strings, the manifest description, and the App Store copy in the new voice, and leave `comedyPrompts.ts` alone.

**Blocked until you decide:** the copy pass in Chunk 5. The mechanical rename is unaffected.

**Reversible:** Yes.

---

## 11. Should the harness stay?

**The decision:** Whether `scripts/harness/` is a permanent part of the repo.

I built it for this audit (`mock-anthropic.ts`, `server.ts`, `run.ts` — 10 scenarios, 24 checks, currently 17 passing). It boots the real handler stack and found five defects that no amount of code reading would have surfaced with confidence.

**Recommendation: keep it, and make the 7 failures the acceptance criteria for Chunks 2–3.** Once they pass, wire it into CI (Chunk 6) so realtime regressions are caught the day they land. It is the only test in the repo that exercises `game.handler.ts` or `voting.handler.ts` at all — both are at **0% coverage**.

If you would rather not carry it, say so and I will remove it. But the 397 existing unit tests never simulate two clients in one room, which is precisely where this class of product breaks.

**Blocked until you decide:** nothing. It is already written and passing.

**Reversible:** Yes.
