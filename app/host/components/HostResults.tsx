'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import type { LevelInfo } from '@/lib/types'
import { shareScriptText } from '@/lib/scriptUtils'
import { SPRING_BOUNCY, SPRING_GENTLE, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { analytics } from '@/lib/analytics'
import { withTimeout } from '@/lib/socketTimeout'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import { DirectorsReview } from '@/components/DirectorsReview'
import { Button } from '@/components/ui'
import { useScriptStore } from '@/stores/scriptStore'
import { useVotingStore } from '@/stores/votingStore'
import { useGameStore } from '@/stores/gameStore'
import { socketManager } from '@/lib/socketManager'

const SPROCKET_PATTERN = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 14px, transparent 14px, transparent 24px)'
const SHIMMER_BG = 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 52%, transparent 70%)'

export interface HostResultsProps {
  userUid: string
  toast: { success: (m: string) => void; error: (m: string) => void }
  onShowPosterLightbox: () => void
  onRequestNewGame: (keepSelections: boolean) => void
}

export function HostResults({
  userUid, toast,
  onShowPosterLightbox, onRequestNewGame,
}: HostResultsProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const { fireWinnerConfetti, fireCelebration } = useConfetti()
  const confettiFiredRef = useRef(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [posterError, setPosterError] = useState(false)

  // Store selectors
  const script = useScriptStore((s) => s.script)
  const scriptImageUrl = useScriptStore((s) => s.imageUrl)
  const gameResults = useVotingStore((s) => s.gameResults)
  const directorsReview = useVotingStore((s) => s.directorsReview)
  const xpEvents = useVotingStore((s) => s.xpEvents)
  const levelUpData = useVotingStore((s) => s.levelUpData)
  const setLevelUpData = useVotingStore((s) => s.setLevelUpData)

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
    if (!userUid) return
    socketManager.emit('get_progression', userUid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [userUid])

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
    const text = `I just played "${script?.title}" on PlotSlop!`
    if (navigator.share) {
      navigator.share({ title: 'PlotSlop', text, url }).catch(() => copyShareUrl(url))
    } else {
      copyShareUrl(url)
    }
  }

  const handleShareScene = async () => {
    if (!script) return
    if (shareUrl) { triggerShare(shareUrl); return }
    setIsSharing(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyResponse: any = await withTimeout(
        (cb) => socketManager.emit('get_game_history', userUid || '', 1, cb),
        10000
      )
      if (historyResponse.success && historyResponse.games && historyResponse.games.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shareResponse: any = await withTimeout(
          (cb) => socketManager.emit('share_game', historyResponse.games[0].id, cb),
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
  const players = useGameStore((s) => s.players)

  // Build cast list: player name + assigned character
  const castList = players
    .filter(p => !p.isHost && p.role === 'PLAYER')
    .map(p => ({ name: p.nickname, character: p.assignedCharacter }))

  // Find winner's character
  const winnerPlayer = winner ? players.find(p => p.nickname === winner.playerName) : null
  const winnerCharacter = winnerPlayer?.assignedCharacter

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="min-h-dvh w-full flex flex-col relative overflow-hidden"
      style={{ background: 'var(--color-void)' }}
    >
      {/* Film strip sprocket holes — left */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '20px',
        background: SPROCKET_PATTERN, zIndex: 1, pointerEvents: 'none',
      }} />
      {/* Film strip sprocket holes — right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '20px',
        background: SPROCKET_PATTERN, zIndex: 1, pointerEvents: 'none',
      }} />

      <div className="w-full mx-auto px-5 py-6 flex flex-col flex-1" style={{ maxWidth: isDesktop ? '1000px' : '512px' }}>
        {/* MVP Hero — premiere style */}
        {winner && (
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING_BOUNCY}
            aria-live="polite"
            aria-atomic="true"
          >
            <motion.div
              className="mx-auto mb-3"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...SPRING_BOUNCY, delay: 0.3 }}
            >
              <svg width="48" height="48" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L11.5 6.1L17 6.9L13 10.8L13.9 16.3L9 13.7L4.1 16.3L5 10.8L1 6.9L6.5 6.1L9 1Z" fill="var(--color-stage-gold)" />
              </svg>
            </motion.div>
            <p style={{
              fontFamily: 'var(--font-code)', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.26em', textTransform: 'uppercase',
              color: 'var(--color-stage-gold)', margin: '0 0 14px',
            }}>
              Tonight&rsquo;s MVP
            </p>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: isDesktop ? 'clamp(48px, 5vw, 64px)' : 'clamp(40px, 11vw, 48px)',
              fontWeight: 400, letterSpacing: '-0.02em',
              color: 'rgba(240,236,228,0.96)', lineHeight: 1.02, marginBottom: '10px',
              textShadow: '0 0 60px rgba(201,162,77,0.35)',
            }}>
              {winner.playerName}
            </h1>
            {winnerCharacter && (
              <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'rgba(240,236,228,0.68)', margin: '0 auto', maxWidth: '40ch' }}>
                as &ldquo;{winnerCharacter}&rdquo;
              </p>
            )}
            <p style={{
              fontFamily: 'var(--font-code)', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(240,236,228,0.6)', marginTop: '12px',
            }}>
              by a vote of {winner.votes} · {script?.title ?? 'tonight&rsquo;s feature'}
            </p>
          </motion.div>
        )}

        {!winner && (
          <motion.div className="text-center mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700,
              color: 'var(--color-theater-text)', marginBottom: '8px',
            }}>
              {script?.title ?? 'Performance Complete'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-theater-muted)' }}>Great show!</p>
          </motion.div>
        )}

        {/* Poster — full-width with shimmer */}
        {scriptImageUrl && !posterError && (
          <motion.div
            className="mx-auto mb-6 cursor-pointer overflow-hidden w-full"
            style={{ maxWidth: isDesktop ? '480px' : '100%', borderRadius: '16px' }}
            onClick={onShowPosterLightbox}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, ...SPRING_GENTLE }}
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
              {/* Shimmer sweep overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '16px', pointerEvents: 'none',
                background: SHIMMER_BG,
                backgroundSize: '200% 100%',
                animation: 'shimmerSweep 5s ease-in-out infinite',
              }} />
              <style>{`@keyframes shimmerSweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }`}</style>
            </div>
          </motion.div>
        )}

        {/* The Cast — credits section */}
        {castList.length > 0 && (
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p style={{
              fontFamily: 'var(--font-code)', fontSize: '9px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.24em',
              color: 'rgba(240,236,228,0.55)', marginBottom: '14px',
            }}>
              Closing credits
            </p>
            <div className="mx-auto" style={{ maxWidth: '420px' }}>
              {castList.map((c, index) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * STAGGER }}
                  style={{
                    display: 'flex', alignItems: 'baseline', gap: '12px',
                    padding: '7px 0',
                    borderBottom: index < castList.length - 1 ? '1px solid rgba(240,236,228,0.07)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-code)', fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(240,236,228,0.85)', whiteSpace: 'nowrap',
                  }}>
                    {c.name}
                  </span>
                  <span aria-hidden style={{ flex: 1, borderBottom: '1px dotted rgba(240,236,228,0.18)', transform: 'translateY(-3px)' }} />
                  {c.character && (
                    <span style={{ fontSize: '12.5px', lineHeight: 1.4, color: 'rgba(240,236,228,0.62)', textAlign: 'right', maxWidth: '58%' }}>
                      {c.character}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Play Again — primary: white bg, dark text */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => onRequestNewGame(false)}
            style={{ background: 'var(--color-stage-gold)', color: '#120f08' }}
          >
            Play Again
          </Button>
        </motion.div>

        {/* Share + Script — secondary: dark bg, muted text, subtle border */}
        <motion.div
          className="flex gap-3 mb-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            loading={isSharing}
            onClick={handleShareScene}
            style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}
          >
            {isSharing ? 'Sharing...' : shareCopied ? 'Copied!' : 'Share'}
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleDownloadScript}
            style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}
          >
            Script
          </Button>
        </motion.div>

        {/* XP Progression */}
        <XPGainAnimation events={xpEvents} show={xpEvents.length > 0} />
        {levelInfo && (
          <motion.div className="w-full max-w-md mx-auto mt-2 mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <XPBar levelInfo={levelInfo} compact />
          </motion.div>
        )}
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={() => setLevelUpData(null)} />

        {/* Highlights */}
        {gameResults?.highlights && gameResults.highlights.length > 0 && (
          <motion.div className="w-full mt-4 mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <details className="rounded-xl overflow-hidden" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.15)' }}>
              <summary className="p-4 cursor-pointer text-center font-semibold text-sm" style={{ color: 'var(--color-theater-muted)' }}>Game Highlights</summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {gameResults.highlights.map((h, i) => (
                  <motion.div key={h.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * STAGGER }} className="text-center p-3 rounded-lg" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.1)' }}>
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

        {/* Watch Replay + Browse Replays */}
        {shareUrl && (
          <motion.div
            className="flex gap-3 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                const code = shareUrl.split('/replay/')[1]
                if (code) router.push(`/replay/${code}`)
              }}
              style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}
            >
              Watch Replay
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => router.push('/replays')}
              style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}
            >
              Browse Replays
            </Button>
          </motion.div>
        )}

        {/* Back to lobby */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => router.push('/')}
            style={{ color: 'var(--color-theater-muted)' }}
          >
            Back to lobby
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
