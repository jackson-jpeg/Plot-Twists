'use client'

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { getVariants, getTransition, MOTION } from '@/lib/animations'

/**
 * Hook that provides motion-aware animation utilities.
 * Automatically respects the user's prefers-reduced-motion preference.
 *
 * Usage:
 *   const { variants, transition, shouldReduce } = useMotionPrefs()
 *   <motion.div variants={variants.fadeInUp} transition={transition} />
 */
export function useMotionPrefs() {
  const shouldReduce = useFramerReducedMotion()

  return {
    /** Whether reduced motion is preferred */
    shouldReduce,
    /** Animation variants that respect reduced motion */
    variants: getVariants(shouldReduce),
    /** Spring transition that respects reduced motion */
    transition: getTransition(shouldReduce),
    /** Get a specific spring preset */
    spring: (preset: 'spring' | 'gentle' | 'snappy' | 'bouncy' = 'spring') =>
      getTransition(shouldReduce, preset),
    /** Inline animation props that collapse to opacity-only when reduced motion */
    fadeIn: shouldReduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  }
}
