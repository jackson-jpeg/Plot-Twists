'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * The homepage hero demo: a real screenplay excerpt typing itself, because
 * "an AI writes the scene while you watch" is the product — show it, don't
 * hang a fake poster for it. Scenes are archetype content (IP-safe, same
 * grammar as the game). Reduced motion renders the full scene statically.
 */

interface DemoLine {
  speaker: string
  text: string
}

interface DemoScene {
  slug: string
  heading: string
  lines: DemoLine[]
}

const SCENES: DemoScene[] = [
  {
    slug: 'lease',
    heading: 'INT. LEASING OFFICE — DAY',
    lines: [
      { speaker: 'THE SWAMP HERMIT', text: 'It says here "no standing water."' },
      { speaker: 'AGENT', text: 'That’s standard, sir.' },
      { speaker: 'THE SWAMP HERMIT', text: 'My entire aesthetic is standing water.' },
      { speaker: 'AGENT', text: 'There is a community pool.' },
      { speaker: 'THE SWAMP HERMIT', text: '...Is it murky?' },
    ],
  },
  {
    slug: 'review',
    heading: 'INT. CONFERENCE ROOM — QUARTERLY REVIEW',
    lines: [
      { speaker: 'DARK LORD OF HR', text: 'Your numbers are... disappointing.' },
      { speaker: 'GARY', text: 'I exceeded every target by twelve percent.' },
      { speaker: 'DARK LORD OF HR', text: 'The tribunal disagrees.' },
      { speaker: 'GARY', text: 'This is a performance review.' },
      { speaker: 'DARK LORD OF HR', text: '...HR has asked me to stop saying tribunal.' },
    ],
  },
  {
    slug: 'beach',
    heading: 'EXT. CROWDED BEACH — NOON',
    lines: [
      { speaker: 'GLOOM GIRL', text: 'Someone is drowning.' },
      { speaker: 'CAPTAIN', text: 'Then SAVE them! That’s the JOB!' },
      { speaker: 'GLOOM GIRL', text: 'I don’t run. I arrive.' },
      { speaker: 'CAPTAIN', text: 'You’re the worst lifeguard I’ve ever hired.' },
      { speaker: 'GLOOM GIRL', text: 'Thank you.' },
    ],
  },
]

const CHAR_MS = 28
const LINE_PAUSE_MS = 420
const SCENE_HOLD_MS = 3600

export function LiveScriptDemo() {
  const reducedMotion = useReducedMotion()
  const [sceneIndex, setSceneIndex] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scene = SCENES[sceneIndex]

  useEffect(() => {
    if (reducedMotion) return
    const line = scene.lines[lineIndex]
    if (!line) {
      // Scene finished — hold, then rotate
      timerRef.current = setTimeout(() => {
        setSceneIndex((s) => (s + 1) % SCENES.length)
        setLineIndex(0)
        setCharCount(0)
      }, SCENE_HOLD_MS)
      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }
    if (charCount < line.text.length) {
      timerRef.current = setTimeout(() => setCharCount((c) => c + 1), CHAR_MS)
    } else {
      timerRef.current = setTimeout(() => {
        setLineIndex((l) => l + 1)
        setCharCount(0)
      }, LINE_PAUSE_MS)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [reducedMotion, scene, lineIndex, charCount])

  const visibleLines = reducedMotion
    ? scene.lines.map((l) => ({ ...l, shown: l.text }))
    : scene.lines.slice(0, lineIndex + 1).map((l, i) => ({
        ...l,
        shown: i < lineIndex ? l.text : l.text.slice(0, charCount),
      }))

  return (
    <div
      aria-label="A scene being written live"
      style={{
        width: '100%',
        background: 'rgba(240,236,228,0.035)',
        border: '1px solid rgba(240,236,228,0.1)',
        borderRadius: '10px',
        padding: '26px 26px 22px',
        minHeight: '380px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <p
        style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: 'rgba(240,236,228,0.55)',
          margin: '0 0 20px',
        }}
      >
        {scene.heading}
      </p>
      {visibleLines.map((l, i) => (
        <div key={`${scene.slug}-${i}`} style={{ marginBottom: '16px' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-stage-gold)',
              margin: '0 0 3px',
              textTransform: 'uppercase',
            }}
          >
            {l.speaker}
          </p>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.55,
              color: 'rgba(240,236,228,0.88)',
              margin: 0,
            }}
          >
            {l.shown}
            {!reducedMotion && i === visibleLines.length - 1 && (
              <span
                aria-hidden
                style={{ color: 'var(--color-stage-red)', marginLeft: '1px' }}
              >
                |
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
