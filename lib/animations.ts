/**
 * Centralized Animation Configuration
 * "Theater Kid's Notebook" - Warm, not loud. Soft shadows. Generous whitespace.
 *
 * This module provides consistent animation presets for use across the app,
 * ensuring visual cohesion and supporting reduced motion preferences.
 */

// Spring animation presets for Framer Motion
export const MOTION = {
  // Standard spring - good for most UI elements
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30
  },

  // Gentle spring - for subtle, elegant animations
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25
  },

  // Snappy spring - for quick, responsive feedback
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35
  },

  // Bouncy spring - for playful, attention-grabbing animations
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20
  },

  // Dramatic spring - for ceremony reveals (title, MVP, etc.)
  dramatic: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 18
  },

  // Duration presets (in seconds for Framer Motion)
  duration: {
    instant: 0,
    fast: 0.15,
    standard: 0.25,
    slow: 0.35,
    slower: 0.5,
    long: 1,
    longer: 1.5,
    longest: 2
  },

  // Easing curves (as arrays for Framer Motion)
  easing: {
    out: [0.33, 1, 0.68, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const
  }
}

// Button microinteraction presets (centralized for consistency)
export const BUTTON = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  ctaHover: { scale: 1.08 },
  ctaTap: { scale: 0.92 },
}

// Stagger delay presets (in seconds)
export const STAGGER = {
  fast: 0.05,
  standard: 0.08,
  slow: 0.12
}

// Common animation variants for reusable patterns
export const VARIANTS = {
  // Fade in from below
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  },

  // Fade in from above
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
  },

  // Scale in from center
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },

  // Simple fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Page transition with blur effect
  pageTransition: {
    initial: { opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      y: -10,
      filter: 'blur(4px)',
      transition: { duration: 0.25 }
    }
  },

  // Curtain rise — clipPath reveal for PERFORMING state
  curtainRise: {
    initial: { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
    animate: {
      opacity: 1,
      clipPath: 'inset(0% 0 0 0)',
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      transition: { duration: 0.3 }
    }
  },

  // Drum roll — scale overshoot for MVP / title reveals
  drumRoll: {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: 1,
      scale: [0, 1.15, 1],
      transition: { duration: 0.6, times: [0, 0.7, 1], ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  },

  // Curtain drop — slides down from above with spring
  curtainDrop: {
    initial: { opacity: 0, y: '-100%' },
    animate: {
      opacity: 1,
      y: '0%',
      transition: { type: 'spring' as const, stiffness: 180, damping: 18 }
    },
    exit: { opacity: 0, y: '-50%', transition: { duration: 0.3 } }
  },

  // Countdown pulse — rhythmic scale beat
  countdownPulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.08, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
    }
  },

  // Spotlight — brightness reveal for RESULTS state
  spotlight: {
    initial: { opacity: 0, scale: 0.9, filter: 'brightness(0.3)' },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      filter: 'brightness(1.5)',
      transition: { duration: 0.3 }
    }
  }
}

// Reduced motion variants (minimal/instant animations)
export const REDUCED_MOTION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  fadeInDown: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  scaleIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  slideInLeft: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  slideInRight: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  pageTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  curtainRise: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  spotlight: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  drumRoll: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  curtainDrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  countdownPulse: {
    initial: { scale: 1 },
    animate: { scale: 1 }
  }
}

/**
 * Helper to get appropriate variants based on reduced motion preference
 */
export function getVariants(shouldReduceMotion: boolean | null) {
  return shouldReduceMotion ? REDUCED_MOTION_VARIANTS : VARIANTS
}

/**
 * Helper to get appropriate transition based on reduced motion preference
 */
export function getTransition(
  shouldReduceMotion: boolean | null,
  preset: keyof typeof MOTION = 'spring'
) {
  if (shouldReduceMotion) {
    return { duration: 0 }
  }

  if (preset === 'spring' || preset === 'gentle' || preset === 'snappy' || preset === 'bouncy' || preset === 'dramatic') {
    return MOTION[preset]
  }

  return MOTION.spring
}

/**
 * Stagger children animation helper
 */
export function staggerChildren(
  staggerDelay = 0.05,
  shouldReduceMotion: boolean | null = false
) {
  if (shouldReduceMotion) {
    return {
      animate: {
        transition: {
          staggerChildren: 0
        }
      }
    }
  }

  return {
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  }
}
