'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpectatorMessage } from '@/lib/types'

const PRESET_MESSAGES = [
  { text: 'LOL', icon: '😂' },
  { text: 'Do it again!', icon: '🔁' },
  { text: 'BOOOO', icon: '👎' },
  { text: 'MORE!', icon: '🔥' },
  { text: 'That was terrible', icon: '💀' },
  { text: 'Oscar-worthy!', icon: '🏆' },
  { text: 'Plot twist!', icon: '🌀' },
  { text: 'I can\'t breathe', icon: '🤣' },
]

interface SpectatorChatProps {
  messages: SpectatorMessage[]
  onSendMessage: (text: string, isPreset: boolean) => void
  disabled?: boolean
}

export function SpectatorChat({ messages, onSendMessage, disabled }: SpectatorChatProps) {
  const [customText, setCustomText] = useState('')
  const [cooldown, setCooldown] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll ticker to bottom
  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = tickerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text: string, isPreset: boolean) => {
    if (cooldown || disabled || !text.trim()) return
    onSendMessage(text.trim(), isPreset)
    setCustomText('')
    setCooldown(true)
    setTimeout(() => setCooldown(false), 5000)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: 'var(--color-surface)',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      {/* Message ticker */}
      <div
        ref={tickerRef}
        style={{
          maxHeight: '120px',
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          scrollBehavior: 'smooth',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.slice(-20).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                gap: '6px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
                {msg.senderName}:
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
            Send a message to heckle the performers!
          </div>
        )}
      </div>

      {/* Preset buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '0 8px',
      }}>
        {PRESET_MESSAGES.map((preset) => (
          <button
            key={preset.text}
            onClick={() => handleSend(preset.text, true)}
            disabled={cooldown || disabled}
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: cooldown ? 'var(--color-surface-alt)' : 'transparent',
              color: cooldown ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              fontSize: '12px',
              cursor: cooldown ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: cooldown ? 0.5 : 1,
            }}
          >
            {preset.icon} {preset.text}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '0 8px 8px',
      }}>
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value.slice(0, 100))}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(customText, false) }}
          placeholder={cooldown ? 'Wait 5s...' : 'Type a message...'}
          disabled={cooldown || disabled}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSend(customText, false)}
          disabled={cooldown || disabled || !customText.trim()}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            background: cooldown || !customText.trim() ? 'var(--color-border)' : 'var(--color-accent)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: cooldown || !customText.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

/**
 * Scrolling ticker display for the host TV screen (Twitch chat style)
 */
interface SpectatorTickerProps {
  messages: SpectatorMessage[]
}

export function SpectatorTicker({ messages }: SpectatorTickerProps) {
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = tickerRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      ref={tickerRef}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        width: '280px',
        maxHeight: '200px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <AnimatePresence initial={false}>
        {messages.slice(-10).map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.85, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              fontSize: '13px',
              lineHeight: 1.3,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{msg.senderName}</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', marginLeft: '6px' }}>{msg.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
