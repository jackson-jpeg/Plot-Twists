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

// Interaction
export const PRESS = { whileTap: { scale: 0.97 } }

// Stagger delay (seconds)
export const STAGGER = 0.04
