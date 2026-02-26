'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo } from '@/lib/types'
import { downloadScript, copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { successHaptic } from '@/hooks/useHaptics'
import { Modal } from '@/components/Modal'
import { VARIANTS } from '@/lib/animations'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface JoinResultsProps {
  script: Script | null
  gameResults: GameResults | null
  scriptImageUrl: string | null
  showPosterLightbox: boolean
  socket: AppSocket | null
  myPlayerId: string
  userUid: string
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
  onDismissLevelUp: () => void
  onShowPosterLightbox: () => void
  onClosePosterLightbox: () => void
}

export function JoinResults({
  script, gameResults, scriptImageUrl,
  showPosterLightbox, socket, myPlayerId, userUid,
  xpEvents, levelUpData, onDismissLevelUp,
  onShowPosterLightbox, onClosePosterLightbox,
}: JoinResultsProps) {
  const router = useRouter()
  const [copySuccess, setCopySuccess] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)

  useEffect(() => {
    const uid = userUid || myPlayerId
    if (!socket || !uid) return
    socket.emit('get_progression', uid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [socket, userUid, myPlayerId])

  const handleCopyScript = async () => {
    if (!script) return
    const success = await copyScriptToClipboard(script)
    if (success) { successHaptic(); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000) }
  }

  const handleShareScript = async () => {
    if (!script) return
    await shareScriptText(script)
    successHaptic()
  }

  return (
    <motion.div key="results" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg">
      <div className="card text-center">
        {gameResults?.winner ? (
          <>
            {/* Trophy */}
            <div className="relative inline-block mb-6">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="text-8xl relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>🏆</motion.div>
            </div>

            {/* Poster */}
            {scriptImageUrl && (
              <motion.div className="mx-auto mb-4 flex flex-col items-center" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ perspective: 1000 }}>
                <motion.div onClick={onShowPosterLightbox} className="cursor-pointer overflow-hidden" style={{ maxWidth: 200, borderRadius: 'var(--radius-xl, 16px)', border: '3px solid var(--color-accent)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <img src={scriptImageUrl} alt={`${script?.title} Poster`} className="w-full block object-contain" />
                </motion.div>
                {script && <motion.p className="font-display text-base mt-2" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{script.title}</motion.p>}
              </motion.div>
            )}

            <motion.h1 className="text-4xl font-display mb-2" style={{ color: 'var(--color-accent)' }} initial={{ y: -20, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5, duration: 0.5 }}>
              {gameResults.winner.playerName} Wins!
            </motion.h1>
            <motion.p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>MVP</span> with {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
            </motion.p>

            <Standings results={gameResults.allResults} />
          </>
        ) : (
          <>
            <div className="relative inline-block mb-6">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent-2) 0%, transparent 70%)' }}
                animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="text-8xl relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>🎉</motion.div>
            </div>

            {scriptImageUrl && (
              <motion.div className="mx-auto mb-4 flex flex-col items-center" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ perspective: 1000 }}>
                <motion.div onClick={onShowPosterLightbox} className="cursor-pointer overflow-hidden" style={{ maxWidth: 200, borderRadius: 'var(--radius-xl, 16px)', border: '3px solid var(--color-accent-2)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} className="w-full block object-contain" />
                </motion.div>
                {script && <motion.p className="font-display text-base mt-2" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{script.title}</motion.p>}
              </motion.div>
            )}

            <motion.h1 className="text-4xl font-display mb-6" style={{ color: 'var(--color-text-primary)' }} initial={{ y: -20, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5, duration: 0.5 }}>Performance Complete!</motion.h1>
            <motion.p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>Thanks for playing!</motion.p>
          </>
        )}

        {/* XP Progression */}
        <XPGainAnimation events={xpEvents} show={xpEvents.length > 0} />
        {levelInfo && (
          <motion.div className="w-full max-w-sm mx-auto mt-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <XPBar levelInfo={levelInfo} compact />
          </motion.div>
        )}
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={onDismissLevelUp} />

        {/* Script actions */}
        {script && (
          <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.button onClick={handleShareScript} className="btn btn-secondary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>{'share' in navigator ? '📤' : '💾'}</span><span>{'share' in navigator ? 'Share Script' : 'Save Script'}</span></motion.button>
              <motion.button onClick={handleCopyScript} className="btn btn-ghost" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>{copySuccess ? '✓' : '📋'}</span><span>{copySuccess ? 'Copied!' : 'Copy Script'}</span></motion.button>
            </div>
          </motion.div>
        )}

        {/* Waiting for host */}
        <motion.div className="card text-center p-6" style={{ background: 'var(--color-highlight)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <motion.div className="text-4xl mb-3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>⏳</motion.div>
          <p className="font-display text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>Waiting for Host...</p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>The host will start the next game</p>
          <motion.button
            onClick={() => router.push('/')}
            className="text-sm cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)' }}
            whileTap={{ scale: 0.95 }}
          >
            🚪 Leave Game
          </motion.button>
        </motion.div>
      </div>

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={onClosePosterLightbox} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} />
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

function Standings({ results }: { results: { playerId: string; playerName: string; votes: number }[] }) {
  if (!results || results.length <= 1) return null
  const maxVotes = Math.max(...results.map(r => r.votes), 1)
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  return (
    <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
      <h3 className="font-display text-lg mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>Final Standings</h3>
      <div className="flex flex-col gap-3">
        {results.map((result, index) => {
          const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0
          const barColor = index === 0 ? 'var(--color-accent)' : index === 1 ? 'var(--color-accent-2)' : 'var(--color-border-strong)'
          const isWinner = index === 0
          return (
            <motion.div key={result.playerId} className="text-left rounded-xl p-4"
              style={{ background: isWinner ? 'var(--color-highlight)' : 'var(--color-surface-alt)', border: isWinner ? '2px solid var(--color-accent)' : '1px solid var(--color-border)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + index * 0.15 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <motion.span style={{ fontSize: isWinner ? 28 : 22, display: 'inline-block' }} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.95 + index * 0.15 }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}
                  </motion.span>
                  <span style={{ fontSize: isWinner ? 18 : 16, fontWeight: isWinner ? 700 : 600, color: 'var(--color-text-primary)' }}>{result.playerName}</span>
                </div>
                <span style={{ fontSize: isWinner ? 18 : 16, fontWeight: 700, color: barColor }}>{result.votes}</span>
              </div>
              <div className="w-full rounded-full overflow-hidden relative" style={{ height: isWinner ? 12 : 8, background: 'var(--color-border)' }}>
                <motion.div className="h-full rounded-full relative overflow-hidden" style={{ background: barColor }}
                  initial={{ width: '0%' }} animate={{ width: `${maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}%` }}
                  transition={{ delay: 0.9 + index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                  {isWinner && <div className="progress-bar-shimmer absolute inset-0" />}
                </motion.div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{percentage}% of votes</p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
