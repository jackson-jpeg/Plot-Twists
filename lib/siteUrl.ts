/**
 * The canonical public origin for this deployment.
 *
 * WHY THIS FILE EXISTS, AND WHY IT IS ONE CONSTANT RATHER THAN A CHAIN REPEATED SIX TIMES.
 *
 * Six call sites each wrote their own `NEXT_PUBLIC_BASE_URL || NEXT_PUBLIC_APP_URL || <literal>`
 * chain, and the literals had drifted to THREE DIFFERENT dead domains — `plot-twists.com`
 * (app/layout.tsx), `plottwists.app` (robots, sitemap, both replay files, user.handler) and
 * `plottwists.live` (three watermarks). None of them was ever reached in production anyway,
 * which is the part worth understanding:
 *
 *   `next.config.js` declared `NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ||
 *   'http://localhost:3000'` in its `env` block. Next inlines that at BUILD time, so the second
 *   term of every chain was the literal string 'http://localhost:3000' and the third term was
 *   dead code. The live site served `<meta property="og:image" content="http://localhost:3000/
 *   opengraph-image">` and a sitemap of `http://localhost:3000` URLs — not, as the audit record
 *   claimed, URLs on the expired domain.
 *
 * The consequence that matters operationally: because these are `NEXT_PUBLIC_*`, they are baked
 * into the bundle by the bundler. Setting one in `/etc/plotslop/env` and restarting the service
 * changes NOTHING. It requires a rebuild and a redeploy — which, under CONSTRAINT-1, ends every
 * game in flight. "One line plus a restart" was wrong on both counts.
 */

/**
 * Resolution order:
 *   1. `NEXT_PUBLIC_BASE_URL` — the explicit override, if the deploy sets one.
 *   2. `NEXT_PUBLIC_APP_URL`  — legacy name, still honoured so an existing deploy keeps working.
 *   3. the production origin, in a production build; localhost otherwise.
 *
 * Step 3 is a NODE_ENV check rather than a bare literal so that a dev build still emits
 * localhost URLs — that was the only defensible thing the old `next.config.js` default did,
 * and it is kept here where it cannot leak into a production bundle.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://plotslop.com' : 'http://localhost:3000')

/** The bare host, for the places that print a domain at a human rather than link to it. */
export const SITE_DOMAIN: string = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * The origin the app uses to call its OWN HTTP API from server-side render paths — the invite-link
 * OG card and the three share-card image routes, all of which fetch game state before drawing.
 *
 * MISSED BY THE 2026-07-30 CHUNK 5 SWEEP, AND THE MISS IS INSTRUCTIVE. Four call sites wrote
 * `NEXT_PUBLIC_WS_URL || 'http://localhost:3000'`. The sweep found the *display* domain in two of
 * those same files and fixed it — `poster-story` and `clip-card` both already import SITE_DOMAIN —
 * but left the *fetch* target alone, because a grep for dead brand domains does not match
 * "localhost". So the record went on to claim "the localhost OG bug is dead" on the strength of
 * verifying `/opengraph-image`, the one card that does not fetch anything.
 *
 * What it actually did in production, confirmed on 2026-07-30 by reading `PORT` out of the unit's
 * environment and then by fetching both ports and comparing `<title>`:
 *
 *   PlotSlop listens on :3100.  localhost:3000 is a DIFFERENT next-server — sang3r.com.
 *
 * `NEXT_PUBLIC_WS_URL` is not set in /etc/plotslop/env, and `NEXT_PUBLIC_*` is inlined at build
 * time, so the literal was baked into the bundle. Every one of those four fetches went to
 * Jackson's personal site, 404'd, and the card silently fell back to its generic form. It failed
 * quietly, which is why nothing surfaced it: an invite preview that renders *something* looks fine.
 *
 * Defaulting to SITE_URL means the app calls itself through its own public origin. That is one
 * extra hop through nginx versus a loopback port, and worth it: there is now no port number
 * written down in application code that a deploy could move out from under.
 */
export const API_ORIGIN: string = process.env.NEXT_PUBLIC_WS_URL || SITE_URL
