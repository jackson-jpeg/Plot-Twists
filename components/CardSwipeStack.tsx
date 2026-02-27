'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion'
import type { CardSelection, AvailableCards } from '@/lib/types'
import { ContentItem } from '@/lib/content-types'
import { getFilteredContentRich } from '@/lib/content'
import { tapHaptic } from '@/hooks/useHaptics'

type TabKey = 'character' | 'setting' | 'circumstance'

const TABS: { key: TabKey; label: string; contentType: 'characters' | 'settings' | 'circumstances' }[] = [
  { key: 'character', label: 'Character', contentType: 'characters' },
  { key: 'setting', label: 'Setting', contentType: 'settings' },
  { key: 'circumstance', label: 'Circumstance', contentType: 'circumstances' },
]

// Spring physics — tunable values from spec
const SPRING_CONFIG = {
  stiffness: 300,
  damping: 24,
  mass: 0.8,
  restDelta: 0.5,
}

const DISMISS_THRESHOLD = 120
const ROTATION_FACTOR = 0.08
const MAX_ROTATION = 15
const FLYOUT_VELOCITY = 800

// Stack visual offsets
const STACK_Y = [3, 6, 10, 16]
const STACK_ROTATION = [-0.8, 1.2, -1.5, 2.8]
const STACK_SCALE = [0.99, 0.975, 0.96, 0.945]

export interface CardSwipeStackProps {
  selection: CardSelection
  setSelection: (s: CardSelection) => void
  isMature: boolean
  availableCards: AvailableCards
  onShuffleAll: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

function SwipeableCard({
  item,
  onSwipe,
  isTop,
  stackIndex,
}: {
  item: ContentItem
  onSwipe: (direction: 'left' | 'right') => void
  isTop: boolean
  stackIndex: number
}) {
  const x = useMotionValue(0)
  const springX = useSpring(x, SPRING_CONFIG)

  // Rotation follows drag
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION])

  // Shadow shifts opposite to drag (parallax)
  const shadowX = useTransform(x, (v) => -v * 0.15)
  const shadowBlur = useTransform(x, (v) => 40 + Math.abs(v) * 0.2)

  // KEEP/SKIP opacity
  const keepOpacity = useTransform(x, [0, 100], [0, 1])
  const skipOpacity = useTransform(x, [-100, 0], [1, 0])

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x
      const velocity = info.velocity.x

      if (Math.abs(offset) > DISMISS_THRESHOLD || Math.abs(velocity) > FLYOUT_VELOCITY) {
        onSwipe(offset > 0 ? 'right' : 'left')
      }
    },
    [onSwipe]
  )

  // Stack card (not draggable)
  if (!isTop) {
    const idx = Math.min(stackIndex - 1, 3)
    return (
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          transformOrigin: 'center bottom',
        }}
        animate={{
          y: STACK_Y[idx] ?? 16,
          rotate: STACK_ROTATION[idx] ?? 2.8,
          scale: STACK_SCALE[idx] ?? 0.945,
        }}
        transition={SPRING_CONFIG}
      />
    )
  }

  // Top card — draggable
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        x: springX,
        rotate,
        cursor: 'grab',
        zIndex: 10,
        touchAction: 'none',
      }}
      drag="x"
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      exit={{
        x: x.get() > 0 ? 500 : -500,
        rotate: x.get() > 0 ? 20 : -20,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      {/* Card face */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 20,
          background: '#F5F0E8',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          boxShadow: useTransform(
            [shadowX, shadowBlur],
            ([sx, sb]) => `${sx}px 12px ${sb}px rgba(0,0,0,0.5)`
          ),
        }}
      >
        {/* KEEP indicator */}
        <motion.div
          style={{
            position: 'absolute',
            top: 24,
            left: 20,
            padding: '6px 16px',
            borderRadius: 8,
            border: '3px solid #F59E42',
            background: 'rgba(245,158,66,0.08)',
            opacity: keepOpacity,
            transform: 'rotate(-18deg)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#F59E42',
            }}
          >
            KEEP
          </span>
        </motion.div>

        {/* SKIP indicator */}
        <motion.div
          style={{
            position: 'absolute',
            top: 24,
            right: 20,
            padding: '6px 16px',
            borderRadius: 8,
            border: '3px solid #FF5050',
            background: 'rgba(255,80,80,0.08)',
            opacity: skipOpacity,
            transform: 'rotate(18deg)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#FF5050',
            }}
          >
            SKIP
          </span>
        </motion.div>

        {/* Category label + icon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(42,39,34,0.3)',
            }}
          >
            {item.category}
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(42,39,34,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(42,39,34,0.35)"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            paddingTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(36px, 10vw, 52px)',
              lineHeight: 0.95,
              letterSpacing: '-0.01em',
              color: '#2A2722',
            }}
          >
            {item.name.toUpperCase()}
          </span>
          <div style={{ width: 40, height: 3, background: '#F59E42', borderRadius: 2 }} />
          {item.source && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                color: 'rgba(42,39,34,0.5)',
                lineHeight: 1.4,
              }}
            >
              {item.source}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(42,39,34,0.18)',
              fontWeight: 500,
            }}
          >
            PLOT TWISTS
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CardSwipeStack({
  selection,
  setSelection,
  isMature,
  availableCards,
  onShuffleAll,
  toast,
}: CardSwipeStackProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('character')
  const [deckIndex, setDeckIndex] = useState(0)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    }
  }, [])

  // Reset deck index when switching tabs
  useEffect(() => {
    setDeckIndex(0)
  }, [activeTab])

  const richContent = useMemo(() => getFilteredContentRich({ isMature }), [isMature])

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!
  const contentItems = richContent[activeTabConfig.contentType]

  // Shuffle deck per tab
  const shuffledDeck = useMemo(() => {
    const items = [...contentItems]
    // Fisher-Yates shuffle with stable seed per tab
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }, [contentItems])

  const visibleCards = useMemo(() => {
    return shuffledDeck.slice(deckIndex, deckIndex + 5)
  }, [shuffledDeck, deckIndex])

  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length

  const advanceToNextTab = useCallback(
    (newSelection: CardSelection) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = setTimeout(() => {
        const tabOrder: TabKey[] = ['character', 'setting', 'circumstance']
        const currentIdx = tabOrder.indexOf(activeTab)
        for (let i = 1; i <= tabOrder.length; i++) {
          const nextTab = tabOrder[(currentIdx + i) % tabOrder.length]
          if (!newSelection[nextTab]) {
            setActiveTab(nextTab)
            return
          }
        }
      }, 600)
    },
    [activeTab]
  )

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const currentCard = visibleCards[0]
      if (!currentCard) return

      tapHaptic()
      if ('vibrate' in navigator) navigator.vibrate(direction === 'right' ? [50] : [30, 20, 30])

      if (direction === 'right') {
        // KEEP — select this card
        const newSelection = { ...selection, [activeTab]: currentCard.name }
        setSelection(newSelection)
        toast.success(`Picked: ${currentCard.name}`, { duration: 1500 })
        advanceToNextTab(newSelection)
      }

      // Advance deck
      setDeckIndex((prev) => prev + 1)
    },
    [visibleCards, selection, setSelection, activeTab, toast, advanceToNextTab]
  )

  const handleShuffleAll = useCallback(() => {
    onShuffleAll()
    toast.success('Shuffled all!', { duration: 1500 })
  }, [onShuffleAll, toast])

  const clearCard = useCallback(
    (tab: TabKey) => {
      setSelection({ ...selection, [tab]: '' })
      setActiveTab(tab)
    },
    [selection, setSelection]
  )

  const noCardsLeft = deckIndex >= shuffledDeck.length

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#080808',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '48px 24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            PICK YOUR SCENE
          </span>
          <span
            className="font-display"
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 0.9,
              letterSpacing: '-0.01em',
            }}
          >
            {activeTabConfig.label.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {TABS.map((tab) => (
              <motion.div
                key={tab.key}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
                animate={{
                  backgroundColor: selection[tab.key]
                    ? '#F59E42'
                    : activeTab === tab.key
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(255,255,255,0.15)',
                }}
                onClick={() => setActiveTab(tab.key)}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {selectedCount}/3
          </span>
        </div>
      </div>

      {/* Card Stack Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '24px 38px',
          minHeight: 430,
          maxHeight: 500,
        }}
      >
        {noCardsLeft ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              No more cards — shuffle for more
            </span>
            <button
              onClick={() => setDeckIndex(0)}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#F59E42',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reshuffle deck
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {visibleCards
              .slice()
              .reverse()
              .map((card, reverseIdx) => {
                const stackIndex = visibleCards.length - 1 - reverseIdx
                return (
                  <SwipeableCard
                    key={`${card.id}-${deckIndex + stackIndex}`}
                    item={card}
                    isTop={stackIndex === 0}
                    stackIndex={stackIndex}
                    onSwipe={handleSwipe}
                  />
                )
              })}
          </AnimatePresence>
        )}
      </div>

      {/* Swipe Hints */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 80,
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <button
          onClick={() => handleSwipe('left')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Skip card"
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '2px solid rgba(255,80,80,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,80,80,0.5)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,80,80,0.4)',
            }}
          >
            SKIP
          </span>
        </button>
        <button
          onClick={() => handleSwipe('right')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Keep card"
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '2px solid #F59E42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,158,66,0.2)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#F59E42">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#F59E42',
            }}
          >
            KEEP
          </span>
        </button>
      </div>

      {/* Bottom: swipe instruction */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          padding: '16px 0 12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
          }}
        >
          SWIPE TO CHOOSE
        </span>
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path d="M2 6h16M14 1l5 5-5 5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Selected cards summary — bottom sheet */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          style={{
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map((tab) => {
              const value = selection[tab.key]
              if (!value) return null
              return (
                <motion.div
                  key={tab.key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: 'rgba(245,158,66,0.1)',
                    border: '1px solid rgba(245,158,66,0.2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {value}
                  </span>
                  <button
                    onClick={() => clearCard(tab.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${tab.label}`}
                  >
                    ✕
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
