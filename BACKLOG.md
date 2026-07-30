# BACKLOG — parked until after playtest

**Nothing in this file gets touched until chunks 1–4 ship and the game has been played with eight people who are not Jackson's friends.**

This file exists so parked ideas stop competing for attention. Adding to it is free. Taking something out of it requires the playtest to have happened.

See the scope freeze in `CHUNKS.md`.

---

## Mascot

Decided 2026-07-28: **do not build.**

`grep -rn -i "reely"` returns zero matches in both `/root/Plot-Twists` and `/root/PlotTwists-Native`. Reely was a paragraph in a brief, never an asset, component, state, or animation. Track 8 of the audit resolved by deletion rather than by design.

When this comes back up, the audit's recommendation was: don't build a film projector. The cinema *staging* language (film-strip sprockets, clapperboard stripes, chase lights, curtains, spotlights) is already built, coherent, and survives the rename fine — keep it. But a one-eyed projector earnestly representing "film" undercuts the joke the new name is making. If a mascot gets built, build something that leans into the mess.

Estimated cost when it happens: 3–5 designer-days for character design, ~6 states, idle/reaction/celebrate animations, app icon, OG image.

**Ship no mascot: 0 days. That is the current plan.**

---

## Features built while the deployment was dead

Not deletions — these exist, work, and cost nothing to leave alone. They are parked because they were built against zero evidence anyone wants them, and re-touching them before the playtest repeats the mistake.

- Card packs (`server/services/cardpack.service.ts`, `server/handlers/cardpack.handler.ts`, community packs)
- Referrals (`server/services/referral.service.ts`)
- Weekly challenges + progression + XP (`server/services/progression.service.ts`)
- Leaderboards (`get_leaderboard`)
- Director's Review (`server/services/directorsReview.service.ts`)
- Audience plot twists (`server/services/audience.service.ts`)
- tvOS target (`com.plottwists.tv`) — see below

---

## iOS + tvOS

Shelved 2026-07-28. Full reasoning in `/root/PlotTwists-Native/AUDIT-iOS.md`.

Not renamed (349 occurrences left alone). No bundle-ID decision made — that stays deferred precisely because it becomes irreversible on first App Store submission. tvOS target kept.

The tvOS target is the piece worth remembering: TV as the shared screen with phones as controllers is the Jackbox shape, and it is something the web version structurally cannot be. That is real optionality, which is why the recommendation was shelve rather than delete.

Revisit only after the web app has been played by strangers.

---

## Chunk 7 — the homepage design pass

Parked 2026-07-30 by Jackson, explicitly **after the playtest**. Logged here so it is not
re-discovered a third time. **Do not start any of it.**

The findings, in his words:

- **Four stacked headings, with "Now Showing" duplicated.** Measured on the live page: the string
  appears **four** times before a visitor reaches the fold — the marquee subtitle
  (`components/LandingPage.tsx:81`), the section heading
  (`components/HomepagePosterShowcase.tsx:203`), the glass pill on the hero card, and the status
  label on the active sidebar row. The other five rows say "Coming Soon", which is the same word
  doing a different job.
- **Letterspaced uppercase used for body copy throughout.** Not just for labels — the hero hook and
  every sidebar hook are set `textTransform: uppercase` at `letterSpacing: 0.04–0.06em`. That is a
  label treatment applied to sentences, and it is why the page reads as slower than it is.
- **Three competing accents on near-black.** Stage gold (`--color-stage-gold`), the orange-red CTA
  (`--color-accent`), and a per-entry accent from each showcase palette that changes every 4.8s.
  Nothing establishes which one means "primary action".
- **No hierarchy between the five sidebar cards.** Six rows, identical weight, distinguished only
  by border colour and opacity. Nothing says which one a first-time visitor should read.

One more, found while fixing the poster wall and **not** on Jackson's list — left alone under the
same freeze:

- **A near-white strip under the landing page on mobile.** `body` is `--color-bg: #FAFAF9`
  (`app/globals.css:35`, applied at `:389`) and the app shell paints nothing over it, so any dark
  route whose `<main>` is taller than its content shows body colour through the gap. On the landing
  route that gap is the 72px bottom-nav allowance. Pre-existing and independent of the cards: the
  padding belongs to `<main>`, and `/join` has no strip only because its `<main>` has no bottom
  padding. Shortening the poster wall did not create it, it just brings it into view sooner.
  Desktop is unaffected. The fix is one background declaration, but which element owns the page
  background is a shell decision, which is Chunk 7's to make.

**Not in scope for Chunk 7 because it is already done:** the empty image slots. Fixed 2026-07-30 —
see `lib/homepageShowcase.ts` and `DECISIONS.md` #15. The cards are typographic and there is no
artwork pipeline behind them to revive.

---

## Deferred technical work

Real, but not on the critical path to a playtest:

- **Socket.IO Redis adapter + externalised timers.** All game state lives in process-local `Map`s (`server/services/room.service.ts:20-30`) with no adapter, so the app cannot run more than one replica. Fine at current scale; blocks horizontal scaling. (AUDIT Track 2)
- **Shared socket schema between web and iOS.** Two independent client implementations of one protocol with no contract test; they have already drifted. Generate the Swift `SocketEvent` enum from `lib/types.ts`. (AUDIT Track 6)
- **Migrate `claude-sonnet-4-5-20250929` → `claude-sonnet-5`** and wire up the dead `CONFIG.generation.model` / `timeoutMs` knobs so the env vars actually do something. (AUDIT Track 3)
- **Backup/restore drill.** Confirm Firestore PITR is on, script an export, run one restore. Becomes urgent the moment there is a paying customer — Stripe and RevenueCat are already wired. (AUDIT Track 10)
- **Track 5 measurements that were never taken** because the build was broken: throttled-4G Lighthouse, player-device JS payload, Motion 12 main-thread work, theater-mode contrast ratios, screen-reader path.
