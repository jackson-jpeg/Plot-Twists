'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SPRING_BOUNCY } from '@/lib/motion'
import type { DirectorsReview as DirectorsReviewType } from '@/lib/types'
import { SITE_DOMAIN } from '@/lib/siteUrl'

interface DirectorsReviewProps {
  review: DirectorsReviewType
  showTitle?: string
  date?: string
  delay?: number
  onShare?: () => void
}

export function DirectorsReview({ review, showTitle, date, delay = 0, onShare }: DirectorsReviewProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="w-full"
      style={{ maxWidth: '420px' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)' }}>
          The review is in
        </span>
        {onShare && (
          <motion.button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="5 12 12 5 19 12" />
            </svg>
            Share
          </motion.button>
        )}
      </div>

      {/* Review card — dark cinematic */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a2a3a 0%, #0f1a26 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '28px 24px',
        }}
      >
        {/* Stars + rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.3 + i * 0.06, ...SPRING_BOUNCY }}
              >
                <StarIcon filled={i <= review.rating} />
              </motion.span>
            ))}
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-accent)' }}>
            {review.rating}/5
          </span>
        </div>

        {/* Show title */}
        <h3
          className="font-display"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: '4px',
          }}
        >
          {showTitle || review.headline}
        </h3>

        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>
          Reviewed by AI Director
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />

        {/* Review body — italic paragraphs */}
        <div style={{ fontSize: '16px', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
          {review.review.split('\n\n').length > 1
            ? review.review.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: i < review.review.split('\n\n').length - 1 ? '16px' : 0 }}>
                  &ldquo;{para}&rdquo;
                </p>
              ))
            : <p>&ldquo;{review.review}&rdquo;</p>
          }
        </div>

        {/* Best moment callout */}
        {review.bestMoment && (
          <p style={{ fontSize: '15px', fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', marginTop: '20px' }}>
            &ldquo;{review.bestMoment}&rdquo;
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          <span>{SITE_DOMAIN}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={filled ? '#F59E42' : 'none'} aria-hidden="true">
      <path
        d="M10 2l2.35 4.76 5.25.76-3.8 3.7.9 5.24L10 13.67l-4.7 2.79.9-5.24-3.8-3.7 5.25-.76L10 2z"
        stroke={filled ? '#F59E42' : 'rgba(255,255,255,0.2)'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
