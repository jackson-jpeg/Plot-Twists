'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { AudienceReactionType, AudienceReaction } from '@/lib/types'

interface AudienceReactionBarProps {
  roomCode: string
  isPerforming: boolean
  isHost?: boolean
}

const REACTION_EMOJIS: Record<AudienceReactionType, string> = {
  laugh: '😂',
  cheer: '🎉',
  gasp: '😱',
  boo: '👎',
  applause: '👏'
}

const REACTION_LABELS: Record<AudienceReactionType, string> = {
  laugh: 'Laugh',
  cheer: 'Cheer',
  gasp: 'Gasp',
  boo: 'Boo',
  applause: 'Applause'
}

export function AudienceReactionBar({ roomCode, isPerforming, isHost = false }: AudienceReactionBarProps) {
  const { socket } = useSocket()
  const [reactionCounts, setReactionCounts] = useState<Record<AudienceReactionType, number>>({
    laugh: 0,
    cheer: 0,
    gasp: 0,
    boo: 0,
    applause: 0
  })
  const [floatingReactions, setFloatingReactions] = useState<AudienceReaction[]>([])
  const [cooldown, setCooldown] = useState(false)

  // Handle incoming reactions
  useEffect(() => {
    if (!socket) return

    const handleReactionReceived = (reaction: AudienceReaction) => {
      // Add to floating reactions
      setFloatingReactions(prev => [...prev.slice(-20), reaction])

      // Remove after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id))
      }, 2000)
    }

    const handleReactionCounts = (counts: Record<AudienceReactionType, number>) => {
      setReactionCounts(counts)
    }

    socket.on('audience_reaction_received', handleReactionReceived)
    socket.on('audience_reaction_counts', handleReactionCounts)

    return () => {
      socket.off('audience_reaction_received', handleReactionReceived)
      socket.off('audience_reaction_counts', handleReactionCounts)
    }
  }, [socket])

  const sendReaction = useCallback((type: AudienceReactionType) => {
    if (!socket || cooldown || !isPerforming) return

    socket.emit('send_audience_reaction', roomCode, type)

    // Visual cooldown feedback
    setCooldown(true)
    setTimeout(() => setCooldown(false), 2000)

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [socket, roomCode, cooldown, isPerforming])

  if (!isPerforming) return null

  return (
    <div className="relative">
      {/* Floating reactions overlay (for host view) */}
      {isHost && (
        <div className="fixed bottom-24 right-4 w-64 h-48 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingReactions.map(reaction => (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, y: 50, x: Math.random() * 100 }}
                animate={{ opacity: 1, y: -100 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute text-4xl"
              >
                {REACTION_EMOJIS[reaction.type]}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reaction counts (for host view) */}
      {isHost && (
        <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-3 flex gap-3">
          {(Object.keys(REACTION_EMOJIS) as AudienceReactionType[]).map(type => (
            <div key={type} className="flex flex-col items-center">
              <span className="text-2xl">{REACTION_EMOJIS[type]}</span>
              <span className="text-xs text-white/70">{reactionCounts[type]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction buttons (for audience) */}
      {!isHost && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center">
          <div className={`bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex gap-2 transition-opacity ${cooldown ? 'opacity-50' : ''}`}>
            {(Object.keys(REACTION_EMOJIS) as AudienceReactionType[]).map(type => (
              <motion.button
                key={type}
                onClick={() => sendReaction(type)}
                disabled={cooldown}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                title={REACTION_LABELS[type]}
              >
                {REACTION_EMOJIS[type]}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
