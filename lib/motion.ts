/**
 * Motion presets — premium, spring-physics-based animations
 * Replaces lib/animations.ts (shim kept during migration)
 */

// Spring transitions
export const SPRING = { type: 'spring', stiffness: 400, damping: 28 } as const
export const SPRING_GENTLE = { type: 'spring', stiffness: 260, damping: 24 } as const
export const SPRING_BOUNCY = { type: 'spring', stiffness: 500, damping: 22 } as const

// Enter animations
export const ENTER_Y = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 } }
export const ENTER_SCALE = { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 } }

// Page transition (enter + exit for AnimatePresence phase changes)
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// Reduced-motion fallback (simple opacity, no transforms)
export const PAGE_TRANSITION_REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Interaction
export const PRESS = { whileTap: { scale: 0.97 } }
export const HOVER_LIFT = { whileHover: { scale: 1.02, y: -1 } }

// Stagger delay (seconds)
export const STAGGER = 0.04

// ---------------------------------------------------------------------------
// Design-pass tokens (2026-08-06), as LITERALS. lib/motion is a small module
// that webpack duplicates into ~10 route chunks, so anything it imports gets
// duplicated with it — importing design/tokens from here (or from any leaf)
// cost +21 kb, measured. The values below mirror design/tokens.ts MOTION and
// __tests__/unit/design/motionTokens.test.ts fails if they drift. Colors are
// not mirrored at all: use the CSS custom properties from globals.css
// ('var(--color-…)'), which cost zero JS bytes.
// ---------------------------------------------------------------------------

export const EASE_CAMERA: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const DUR = {
  instant: 0,
  fast: 0.15,
  standard: 0.25,
  slow: 0.35,
  slower: 0.5,
  long: 1.0,
  scene: 1.5,
  sceneLong: 2.0,
} as const
