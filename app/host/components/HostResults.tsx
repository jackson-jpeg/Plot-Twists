'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo, DirectorsReview as DirectorsReviewType } from '@/lib/types'
import { shareScriptText } from '@/lib/scriptUtils'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { analytics } from '@/lib/analytics'
import { withTimeout } from '@/lib/socketTimeout'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import { DirectorsReview } from '@/components/DirectorsReview'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface HostResultsProps {
  script: Script | null
  gameResults: GameResults | null
  scriptImageUrl: string | null
  socket: AppSocket | null
  userUid: string
  toast: { success: (m: string) => void; error: (m: string) => void }
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
  onDismissLevelUp: () => void
  onShowPosterLightbox: () => void
  onRequestNewGame: (keepSelections: boolean) => void
}

export function HostResults({
  script, gameResults, scriptImageUrl, socket, userUid, toast,
  xpEvents, levelUpData, onDismissLevelUp,
  onShowPosterLightbox, onRequestNewGame,
}: HostResultsProps) {
  const router = useRouter()
  const { fireWinnerConfetti, fireCelebration } = useConfetti()
  const confettiFiredRef = useRef(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [directorsReview, setDirectorsReview] = useState<DirectorsReviewType | null>(null)
  const [posterError, setPosterError] = useState(false)

  // Fire confetti on results reveal
  useEffect(() => {
    if (confettiFiredRef.current) return
    confettiFiredRef.current = true
    const delay = setTimeout(() => {
      if (gameResults?.winner) fireWinnerConfetti()
      else fireCelebration()
    }, 400)
    return () => clearTimeout(delay)
  }, [gameResults, fireWinnerConfetti, fireCelebration])

  useEffect(() => {
    if (!socket || !userUid) return
    socket.emit('get_progression', userUid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [socket, userUid])

  // Listen for AI Director's Review
  useEffect(() => {
    if (!socket) return
    socket.on('directors_review', setDirectorsReview)
    return () => { socket.off('directors_review', setDirectorsReview) }
  }, [socket])

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

  const handleShareScene = async () => {
    if (!socket || !script) return
    if (shareUrl) { triggerShare(shareUrl); return }
    setIsSharing(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyResponse: any = await withTimeout(
        (cb) => socket.emit('get_game_history', userUid || '', 1, cb),
        10000
      )
      if (historyResponse.success && historyResponse.games && historyResponse.games.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shareResponse: any = await withTimeout(
          (cb) => socket.emit('share_game', historyResponse.games[0].id, cb),
          10000
        )
        if (shareResponse.success && shareResponse.shareUrl) {
          setShareUrl(shareResponse.shareUrl)
          triggerShare(shareResponse.shareUrl)
        }
      }
    } catch {
      toast.error('Failed to share — please try again')
    } finally {
      setIsSharing(false)
    }
  }

  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const winner = gameResults?.winner
  const castNames = gameResults?.allResults?.map(r => r.playerName) ?? []

  return (
    <motion.div
      key="results"
      variants={VARIANTS.spotlight}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-dvh w-full flex flex-col"
      style={{ background: 'var(--color-theater-bg)' }}
    >
      <div className="w-full mx-auto px-5 py-6 flex flex-col flex-1" style={{ maxWidth: isDesktop ? '1000px' : '512px' }}>
        {/* MVP Hero — centered star + label + name */}
        {winner && (
          <motion.div
            className="text-center mb-6"
            variants={VARIANTS.drumRoll}
            initial="initial"
            animate="animate"
            aria-live="polite"
            aria-atomic="true"
          >
            <motion.div
              className="mx-auto mb-3"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
            >
              <svg width="48" height="48" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L11.5 6.1L17 6.9L13 10.8L13.9 16.3L9 13.7L4.1 16.3L5 10.8L1 6.9L6.5 6.1L9 1Z" fill="#F59E42" />
              </svg>
            </motion.div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-theater-muted)', letterSpacing: '0.15em' }}
            >
              Most Valuable Player
            </p>
            <h1
              className="font-display"
              style={{ fontSize: isDesktop ? '42px' : '36px', fontWeight: 800, color: '#F59E42', lineHeight: 1.1, marginBottom: '6px' }}
            >
              {winner.playerName}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-theater-muted)' }}>
              {winner.votes} vote{winner.votes !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {!winner && (
          <motion.div className="text-center mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="font-display" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-theater-text)', marginBottom: '8px' }}>
              {script?.title ?? 'Performance Complete'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-theater-muted)' }}>Great show!</p>
          </motion.div>
        )}

        {/* Poster — constrained to ~300px */}
        {scriptImageUrl && !posterError && (
          <motion.div
            className="mx-auto mb-6 cursor-pointer overflow-hidden"
            style={{ maxWidth: '300px', borderRadius: '16px' }}
            onClick={onShowPosterLightbox}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, ...MOTION.dramatic }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <img
                src={scriptImageUrl}
                alt={`${script?.title ?? 'Movie'} Poster`}
                loading="lazy"
                onError={() => setPosterError(true)}
                style={{ width: '100%', display: 'block', borderRadius: '16px' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px',
                background: 'linear-gradient(to top, rgba(26,23,20,0.85) 0%, transparent 100%)',
                borderRadius: '0 0 16px 16px',
              }}>
                <p className="font-display font-bold text-sm" style={{ color: 'var(--color-theater-text)' }}>{script?.title}</p>
                {castNames.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-theater-muted)' }}>
                    Starring {castNames.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Share Results — full-width orange */}
        <motion.button
          onClick={handleShareScene}
          className="w-full py-4 rounded-2xl font-display text-base font-bold mb-3"
          style={{ background: '#F59E42', color: '#1A1714', border: 'none', cursor: 'pointer' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={isSharing}
        >
          {isSharing ? 'Sharing...' : shareCopied ? 'Copied!' : 'Share Results'}
        </motion.button>

        {/* Read Script + Play Again — side by side */}
        <motion.div
          className="flex gap-3 mb-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <motion.button
            onClick={handleDownloadScript}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm"
            style={{
              color: 'var(--color-theater-text)',
              background: 'transparent',
              border: '1px solid rgba(155, 149, 144, 0.3)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Read Script
          </motion.button>
          <motion.button
            onClick={() => onRequestNewGame(false)}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm"
            style={{ background: '#F59E42', color: '#1A1714', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Play Again
          </motion.button>
        </motion.div>

        {/* XP Progression */}
        <XPGainAnimation events={xpEvents} show={xpEvents.length > 0} />
        {levelInfo && (
          <motion.div className="w-full max-w-md mx-auto mt-2 mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <XPBar levelInfo={levelInfo} compact />
          </motion.div>
        )}
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={onDismissLevelUp} />

        {/* Highlights */}
        {gameResults?.highlights && gameResults.highlights.length > 0 && (
          <motion.div className="w-full mt-4 mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <details className="rounded-xl overflow-hidden" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.15)' }}>
              <summary className="p-4 cursor-pointer text-center font-semibold text-sm" style={{ color: 'var(--color-theater-muted)' }}>Game Highlights</summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {gameResults.highlights.map((h, i) => (
                  <motion.div key={h.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="text-center p-3 rounded-lg" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.1)' }}>
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="text-xs" style={{ color: 'var(--color-theater-muted)' }}>{h.label}</div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-theater-text)' }}>{h.value}</div>
                  </motion.div>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        {/* Director's Review */}
        {directorsReview && (
          <div className="flex justify-center mt-4">
            <DirectorsReview review={directorsReview} delay={1.0} />
          </div>
        )}

        {/* Back to lobby */}
        <motion.button
          onClick={() => router.push('/')}
          className="w-full py-4 mt-4 text-sm font-medium"
          style={{ color: 'var(--color-theater-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          whileTap={{ scale: 0.97 }}
        >
          Back to lobby
        </motion.button>
      </div>
    </motion.div>
  )
}
