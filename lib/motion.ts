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
// Design-pass tokens (2026-08-06). lib/motion.ts is the ONE client module that
// imports design/tokens: it already lives in the shared chunk, so the token
// module lands there once. Leaf components import these — importing
// design/tokens directly from leaves duplicated the module into ~10 route
// chunks (+21 kb, measured against the design(2) build; see design/LEDGER.md
// iter 3). Colors are NOT re-exported at all: use the CSS custom properties
// from globals.css ('var(--color-…)'), which cost zero JS bytes.
// ---------------------------------------------------------------------------
import { MOTION as DESIGN_MOTION } from '@/design/tokens'

export const EASE_CAMERA = DESIGN_MOTION.ease.camera as unknown as [number, number, number, number]
export const DUR = DESIGN_MOTION.duration
