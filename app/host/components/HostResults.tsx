'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { LevelInfo } from '@/lib/types'
import { shareScriptText } from '@/lib/scriptUtils'
import { SPRING_BOUNCY, SPRING_GENTLE } from '@/lib/motion'
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
import { socketManager } from '@/lib/socketManager'

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
    const text = `I just played "${script?.title}" on Plot Twists!`
    if (navigator.share) {
      navigator.share({ title: 'Plot Twists', text, url }).catch(() => copyShareUrl(url))
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
  const castNames = gameResults?.allResults?.map(r => r.playerName) ?? []

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING_GENTLE}
      className="min-h-dvh w-full flex flex-col"
      style={{ background: 'var(--color-theater-bg)' }}
    >
      <div className="w-full mx-auto px-5 py-6 flex flex-col flex-1" style={{ maxWidth: isDesktop ? '1000px' : '512px' }}>
        {/* MVP Hero — centered star + label + name */}
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
                <path d="M9 1L11.5 6.1L17 6.9L13 10.8L13.9 16.3L9 13.7L4.1 16.3L5 10.8L1 6.9L6.5 6.1L9 1Z" fill="var(--color-accent)" />
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
              style={{ fontSize: isDesktop ? '42px' : '36px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1.1, marginBottom: '6px' }}
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
            loading={isSharing}
            onClick={handleShareScene}
            style={{ color: 'var(--color-theater-bg)' }}
          >
            {isSharing ? 'Sharing...' : shareCopied ? 'Copied!' : 'Share Results'}
          </Button>
        </motion.div>

        {/* Read Script + Play Again — side by side */}
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
            onClick={handleDownloadScript}
            style={{ color: 'var(--color-theater-text)', background: 'transparent', borderColor: 'rgba(155, 149, 144, 0.3)' }}
          >
            Read Script
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => onRequestNewGame(false)}
            style={{ color: 'var(--color-theater-bg)' }}
          >
            Play Again
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
                // Extract share code from URL
                const code = shareUrl.split('/replay/')[1]
                if (code) router.push(`/replay/${code}`)
              }}
              style={{ color: 'var(--color-theater-text)', background: 'transparent', borderColor: 'rgba(155, 149, 144, 0.3)' }}
            >
              Watch Replay
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => router.push('/replays')}
              style={{ color: 'var(--color-theater-text)', background: 'transparent', borderColor: 'rgba(155, 149, 144, 0.3)' }}
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
