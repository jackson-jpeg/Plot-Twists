'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { DirectorsReview as DirectorsReviewType } from '@/lib/types'

interface DirectorsReviewProps {
  review: DirectorsReviewType
  delay?: number
}

export function DirectorsReview({ review, delay = 0 }: DirectorsReviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        maxWidth: '420px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
            Director&apos;s Review
          </p>
          <p className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2, marginTop: '4px' }}>
            {review.headline}
          </p>
        </div>
        {/* Star Rating */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <StarIcon key={i} filled={i <= review.rating} />
          ))}
        </div>
      </div>

      {/* Review Body */}
      <div style={{ padding: '16px 24px' }}>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
        }}>
          &ldquo;{review.review}&rdquo;
        </p>
      </div>

      {/* Best Moment */}
      <div style={{
        padding: '12px 24px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}>
        <div style={{
          width: '3px',
          minHeight: '32px',
          background: 'var(--color-accent)',
          borderRadius: '2px',
          flexShrink: 0,
        }} />
        <div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Best moment
          </p>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
            {review.bestMoment}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'var(--color-accent)' : 'none'} aria-hidden="true">
      <path
        d="M8 1.5l1.76 3.57 3.94.57-2.85 2.78.67 3.93L8 10.67l-3.52 1.68.67-3.93L2.3 5.64l3.94-.57L8 1.5z"
        stroke={filled ? 'var(--color-accent)' : 'var(--color-border)'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
