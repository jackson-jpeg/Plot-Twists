/**
 * design/tokens.ts — THE FROZEN SPINE
 *
 * Canonical design tokens for PlotSlop. This file is the source of truth;
 * `app/globals.css` @theme mirrors these values for Tailwind 4 utilities, and
 * framer-motion call sites import the MOTION object directly (CSS custom
 * properties can't feed spring configs).
 *
 * RULES (from the 2026-08-06 design protocol):
 * - Changing a token is its OWN iteration type and requires explicit
 *   justification in the commit message. It is never a side effect of a
 *   screen change.
 * - One world-palette + exactly ONE high-chroma accent per surface.
 * - Legacy tokens in globals.css that are not in this file are SUNSET: keep
 *   them working, migrate screens off them as each screen is redesigned,
 *   never use them in new work.
 */

/* ----------------------------------------------------------------------- *
 * TYPE SCALE
 * Perfect-fourth-ish, anchored at 16. The billing size is first-class: the
 * tracked-uppercase micro-type of a film one-sheet's credit block is this
 * product's signature texture (NORTH-STAR §2).
 * ----------------------------------------------------------------------- */
export const TYPE = {
  billing: { size: '10px', tracking: '0.14em', transform: 'uppercase', weight: 600 },
  label:   { size: '11px', tracking: '0.08em', transform: 'uppercase', weight: 600 },
  caption: { size: '13px', tracking: '0em',    transform: 'none',      weight: 400 },
  body:    { size: '16px', tracking: '0em',    transform: 'none',      weight: 400 },
  lead:    { size: '18px', tracking: '0em',    transform: 'none',      weight: 400 },
  titleSm: { size: '22px', tracking: '-0.01em', transform: 'none',     weight: 600 },
  title:   { size: 'clamp(28px, 5vw, 32px)',  tracking: '-0.015em', transform: 'none', weight: 650 },
  display: { size: 'clamp(36px, 6vw, 44px)',  tracking: '-0.02em',  transform: 'none', weight: 700 },
  hero:    { size: 'clamp(48px, 8vw, 64px)',  tracking: '-0.025em', transform: 'none', weight: 750 },
} as const;

/** Uppercase + letterspacing is a LABEL treatment (billing/label only) —
 *  never applied to sentences (NORTH-STAR §5, homepage finding #2). */

/* ----------------------------------------------------------------------- *
 * PALETTE
 * Two worlds. Pre-game is print: paper, ink, one stage accent. In-game is
 * the theater: void black, projected light. Role accents (host/join) are
 * world-tints, not simultaneous decorations.
 * ----------------------------------------------------------------------- */
export const PALETTE = {
  // Print world (pre-game routes)
  paper:     '#f4f0e8',
  cream:     '#faf7f0',
  paperDark: '#e8e2d4',
  ink:       '#0f0e14',

  // Theater world (in-game routes)
  void:        '#08070b',
  theaterBg:   '#09090B',
  theaterText: 'rgba(255,255,255,0.92)',
  theaterMuted:'rgba(255,255,255,0.50)',

  // Stage accents — pick ONE per surface
  stageRed:  '#c23b22',
  stageGold: '#c9a24d',
  stageBlue: '#3a5a8c',

  // Role worlds
  hostPurple: '#A855F7',
  joinPink:   '#EC4899',

  // Semantic (functional, not decorative)
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
} as const;

/* ----------------------------------------------------------------------- *
 * SPACING RHYTHM — 4px base, unchanged from the existing system (it works).
 * ----------------------------------------------------------------------- */
export const SPACE = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

/* ----------------------------------------------------------------------- *
 * RADII — cards are printed objects, not blobs.
 * ----------------------------------------------------------------------- */
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  button: '14px',
  card: '16px',
  xl: '24px',
  full: '9999px',
} as const;

/** The poster ratio. Every poster-shaped element uses exactly this. */
export const POSTER_ASPECT = '2 / 3';

/* ----------------------------------------------------------------------- *
 * MOTION — "a camera, not a toy" (NORTH-STAR §6).
 * Durations/easings mirror the CSS custom properties; springs are for
 * framer-motion where a PHYSICAL OBJECT (card, ticket) is being handled.
 * Every consumer honors prefers-reduced-motion.
 * ----------------------------------------------------------------------- */
export const MOTION = {
  duration: {
    instant: 0,
    fast: 0.15,
    standard: 0.25,
    slow: 0.35,
    slower: 0.5,
    long: 1.0,
    // Camera moves (push-ins, parallax, light sweeps)
    scene: 1.5,
    sceneLong: 2.0,
  },
  ease: {
    out: [0.33, 1, 0.68, 1],
    inOut: [0.65, 0, 0.35, 1],
    // Trailer-style: fast start, long cinematic settle
    camera: [0.22, 1, 0.36, 1],
  },
  spring: {
    // Physical-object handling only (cards, tickets, drags)
    card: { type: 'spring', stiffness: 300, damping: 26 },
    gentle: { type: 'spring', stiffness: 170, damping: 24 },
  },
} as const;

/* ----------------------------------------------------------------------- *
 * FONTS — current stack, by role. NOTE: the display font (Fredoka, rounded)
 * conflicts with NORTH-STAR §5 ("earnest, never bubbly"). Replacing it is a
 * candidate TOKEN ITERATION with its own commit and justification; until
 * then new work should prefer --font-serif (Instrument Serif) for cinematic
 * display moments.
 * ----------------------------------------------------------------------- */
export const FONT = {
  display: 'var(--font-display)', // Fredoka — on notice, see above
  serifDisplay: 'var(--font-serif)', // Instrument Serif — poster/cinematic display
  body: 'var(--font-body)', // DM Sans
  script: 'var(--font-mono)', // Courier Prime — screenplay text
  code: 'var(--font-code)', // Space Mono — billing blocks, codes
} as const;
