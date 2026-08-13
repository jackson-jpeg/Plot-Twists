'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * The pre-connection hold: a calm stage lamp and a sentence, in the theater
 * register (replaces the spinning lightning-bolt emoji states).
 */
export function ConnectingCurtain({ label = 'Connecting the theater\u2026' }: { label?: string }) {
  const reducedMotion = useReducedMotion()
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ minHeight: '60dvh' }}
    >
      <motion.span
        aria-hidden
        animate={reducedMotion ? {} : { opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--color-stage-gold)',
          marginBottom: 18,
          boxShadow: '0 0 24px rgba(201,162,77,0.5)',
        }}
      />
      <p
        role="status"
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '17px',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  )
}
