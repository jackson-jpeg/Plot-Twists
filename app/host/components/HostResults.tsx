'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo } from '@/lib/types'
import { downloadScript, copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
import { VARIANTS } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface HostResultsProps {
  script: Script | null
  gameResults: GameResults | null
  scriptImageUrl: string | null
  socket: AppSocket | null
  userUid: string
  toast: { success: (m: string) => void }
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
  onDismissLevelUp: () => void
  onShowPosterLightbox: () => void
  onRequestSequel: () => void
  onRequestNewGame: (keepSelections: boolean) => void
}

export function HostResults({
  script, gameResults, scriptImageUrl, socket, userUid, toast,
  xpEvents, levelUpData, onDismissLevelUp,
  onShowPosterLightbox, onRequestSequel, onRequestNewGame,
}: HostResultsProps) {
  const router = useRouter()
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)

  useEffect(() => {
    if (!socket || !userUid) return
    socket.emit('get_progression', userUid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [socket, userUid])

  const handleCopyScript = async () => {
    if (!script) return
    const success = await copyScriptToClipboard(script)
    if (success) { successHaptic(); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000) }
  }

  const handleDownloadScript = async () => {
    if (!script) return
    await shareScriptText(script)
    successHaptic()
  }

  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      toast.success('Share link copied!')
      setTimeout(() => setShareCopied(false), 3000)
    } catch {
      toast.success('Link: ' + url)
    }
  }

  const triggerShare = (url: string) => {
    analytics.replayShared('host_results')
    const text = `I just played "${script?.title}" on Plot Twists!`
    if (navigator.share) {
      navigator.share({ title: 'Plot Twists', text, url }).catch(() => copyShareUrl(url))
    } else {
      copyShareUrl(url)
    }
  }

  const handleShareScene = () => {
    if (!socket || !script) return
    if (shareUrl) { triggerShare(shareUrl); return }
    setIsSharing(true)
    socket.emit('get_game_history', userUid || '', 1, (response) => {
      if (response.success && response.games && response.games.length > 0) {
        socket.emit('share_game', response.games[0].id, (shareResponse) => {
          setIsSharing(false)
          if (shareResponse.success && shareResponse.shareUrl) {
            setShareUrl(shareResponse.shareUrl)
            triggerShare(shareResponse.shareUrl)
          }
        })
      } else { setIsSharing(false) }
    })
  }

  return (
    <motion.div key="results" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-4xl">
      <div className="card text-center">
        {gameResults?.winner ? (
          <>
            {/* Trophy */}
            <div className="relative inline-block mb-8">
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div className="text-9xl relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>🏆</motion.div>
            </div>

            {scriptImageUrl && <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} onClick={onShowPosterLightbox} maxWidth={280} variant="results" />}

            <motion.h1 className="hero-title mb-4" style={{ color: 'var(--color-accent)' }} initial={{ y: -30, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5, duration: 0.5 }}>
              {gameResults.winner.playerName} Wins!
            </motion.h1>
            <motion.p className="text-2xl mb-12" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>MVP</span> with {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
            </motion.p>

            <Standings results={gameResults.allResults} />
            <ScriptSummary script={script} scriptImageUrl={scriptImageUrl} copySuccess={copySuccess} onCopy={handleCopyScript} onDownload={handleDownloadScript} />
          </>
        ) : (
          <>
            <div className="relative inline-block mb-8">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, var(--color-accent-2) 0%, transparent 70%)' }} animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="text-9xl relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>🎉</motion.div>
            </div>
            {scriptImageUrl && <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} onClick={onShowPosterLightbox} maxWidth={280} variant="results" />}
            <motion.h1 className="hero-title mb-6" style={{ color: 'var(--color-text-primary)' }} initial={{ y: -30, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5, duration: 0.5 }}>Performance Complete!</motion.h1>
            <motion.p className="text-2xl mb-12" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>Thanks for playing!</motion.p>
          </>
        )}

        {/* XP Progression */}
        <XPGainAnimation events={xpEvents} show={xpEvents.length > 0} />
        {levelInfo && (
          <motion.div className="w-full max-w-md mx-auto mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <XPBar levelInfo={levelInfo} compact />
          </motion.div>
        )}
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={onDismissLevelUp} />

        {/* Highlights */}
        {gameResults?.highlights && gameResults.highlights.length > 0 && (
          <motion.div className="w-full max-w-md mx-auto mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <details className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
              <summary className="p-4 cursor-pointer text-center font-semibold" style={{ color: 'var(--color-text-primary)' }}>🏆 Game Highlights</summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {gameResults.highlights.map((h, i) => (
                  <motion.div key={h.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="text-center p-3 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{h.label}</div>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{h.value}</div>
                  </motion.div>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 items-center mt-8">
          {script && (
            <motion.button onClick={handleShareScene} className="btn btn-large" style={{ minWidth: '280px', background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))', color: 'white', border: 'none' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSharing}>
              <span>{shareCopied ? '✓' : '🔗'}</span><span>{isSharing ? 'Sharing...' : shareCopied ? 'Link Copied!' : 'Share This Scene'}</span>
            </motion.button>
          )}
          {script && (
            <motion.button onClick={onRequestSequel} className="btn btn-primary btn-large" style={{ minWidth: '280px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <span>🎬</span><span>Generate Sequel</span>
            </motion.button>
          )}
          <motion.button onClick={() => onRequestNewGame(false)} className="btn btn-secondary btn-large" style={{ minWidth: '280px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <span>🔄</span><span>New Game (Same Players)</span>
          </motion.button>
          <motion.button onClick={() => router.push('/')} className="btn btn-ghost" style={{ minWidth: '280px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <span>🚪</span><span>Exit to Home</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function Standings({ results }: { results: { playerId: string; playerName: string; votes: number }[] }) {
  if (!results || results.length <= 1) return null
  const maxVotes = Math.max(...results.map(r => r.votes), 1)
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  return (
    <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
      <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--color-text-primary)' }}>Final Standings</h2>
      <div className="flex flex-col gap-4">
        {results.map((result, index) => {
          const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0
          const barColor = index === 0 ? 'var(--color-accent)' : index === 1 ? 'var(--color-accent-2)' : 'var(--color-border-strong)'
          const isWinner = index === 0
          return (
            <motion.div key={result.playerId}
              className="text-left rounded-xl"
              style={{
                background: isWinner ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                border: isWinner ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                padding: '20px 24px',
              }}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + index * 0.15 }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <motion.span style={{ fontSize: isWinner ? 36 : 28, display: 'inline-block' }} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.95 + index * 0.15 }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}
                  </motion.span>
                  <span className="font-display" style={{ fontSize: isWinner ? 22 : 18, fontWeight: isWinner ? 700 : 600, color: 'var(--color-text-primary)' }}>{result.playerName}</span>
                </div>
                <span style={{ fontSize: isWinner ? 22 : 18, fontWeight: 700, color: barColor }}>{result.votes}</span>
              </div>
              <div className="w-full rounded-full overflow-hidden relative" style={{ height: isWinner ? 12 : 8, background: 'var(--color-border)' }}>
                <motion.div className="h-full rounded-full relative overflow-hidden" style={{ background: barColor }}
                  initial={{ width: '0%' }} animate={{ width: `${maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}%` }}
                  transition={{ delay: 0.9 + index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
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

function ScriptSummary({ script, scriptImageUrl, copySuccess, onCopy, onDownload }: {
  script: Script | null; scriptImageUrl: string | null; copySuccess: boolean; onCopy: () => void; onDownload: () => void
}) {
  if (!script) return null
  return (
    <motion.div className="card text-left" style={{ background: 'var(--color-surface-alt)', padding: '20px 24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
      {!scriptImageUrl && (
        <>
          <p className="font-script font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{script.title}</p>
          <p className="italic text-sm mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{script.synopsis}</p>
        </>
      )}
      <div className="flex gap-3 flex-wrap">
        <motion.button onClick={onDownload} className="btn btn-secondary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>{'share' in navigator ? '📤' : '💾'}</span><span>{'share' in navigator ? 'Share Script' : 'Download Script'}</span></motion.button>
        <motion.button onClick={onCopy} className="btn btn-ghost" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>{copySuccess ? '✓' : '📋'}</span><span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span></motion.button>
      </div>
    </motion.div>
  )
}
