'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { LevelInfo } from '@/lib/types'
import { SignInButton } from '@clerk/nextjs'
import { copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { withTimeout } from '@/lib/socketTimeout'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'
import { Modal } from '@/components/Modal'
import { SPRING_BOUNCY, SPRING_GENTLE } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DoorIcon, StarIcon, SpinnerIcon } from '@/components/GameIcons'
import { Button, Card } from '@/components/ui'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import { DirectorsReview } from '@/components/DirectorsReview'
import { useScriptStore } from '@/stores/scriptStore'
import { useVotingStore } from '@/stores/votingStore'
import { useGameStore } from '@/stores/gameStore'
import { socketManager } from '@/lib/socketManager'

const SPROCKET_PATTERN = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 14px, transparent 14px, transparent 24px)'
const SHIMMER_BG = 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 52%, transparent 70%)'

export interface JoinResultsProps {
  myPlayerId: string
  userUid: string
  isGuest?: boolean
  onShowPosterLightbox: () => void
}

export function JoinResults({
  myPlayerId, userUid, isGuest,
  onShowPosterLightbox,
}: JoinResultsProps) {
  const router = useRouter()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const { fireWinnerConfetti, fireCelebration } = useConfetti()
  const confettiFiredRef = useRef(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)

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
    const uid = userUid || myPlayerId
    if (!uid) return
    socketManager.emit('get_progression', uid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [userUid, myPlayerId])

  const getGameId = async (): Promise<string | null> => {
    const uid = userUid || myPlayerId
    if (!uid) return null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyResponse: any = await withTimeout(
        (cb) => socketManager.emit('get_game_history', uid, 1, cb),
        10000
      )
      if (!historyResponse.success || !historyResponse.games?.length) return null
      return historyResponse.games[0].id
    } catch {
      return null
    }
  }

  const handleShareCharacter = async () => {
    const gameId = await getGameId()
    if (!gameId) return
    try {
      const cardUrl = `/api/character-card/${gameId}/${myPlayerId}?format=story`

      const response = await fetch(cardUrl)
      const blob = await response.blob()
      const file = new File([blob], 'my-character.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Character — Plot Twists' })
      } else {
        window.open(cardUrl, '_blank')
      }
    } catch {
      // User cancelled share or error
    }
  }

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

  const players = useGameStore((s) => s.players)
  const winner = gameResults?.winner

  // Build cast list: player name + assigned character
  const castList = players
    .filter(p => !p.isHost && p.role === 'PLAYER')
    .map(p => ({ name: p.nickname, character: p.assignedCharacter }))

  // Find winner's character
  const winnerPlayer = winner ? players.find(p => p.nickname === winner.playerName) : null
  const winnerCharacter = winnerPlayer?.assignedCharacter

  return (
    <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={SPRING_GENTLE} className="relative overflow-hidden" style={{ padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px', background: 'var(--color-void)' }}>
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

      <div className="w-full mx-auto text-center" style={{ maxWidth: isDesktop ? '720px' : '512px' }}>
        {/* MVP Hero — premiere style */}
        {winner ? (
          <motion.div
            className="mb-6"
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
            <span style={{
              display: 'inline-block', background: 'var(--color-stage-gold)', color: 'var(--color-void)',
              padding: '4px 10px', borderRadius: '3px', fontWeight: 700, fontSize: '9px',
              textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px',
            }}>
              MVP
            </span>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: isDesktop ? '36px' : '32px',
              fontWeight: 700, color: 'var(--color-theater-text)', lineHeight: 1.1, marginBottom: '4px',
            }}>
              {winner.playerName}
            </h1>
            {winnerCharacter && (
              <p style={{ fontSize: '15px', color: 'var(--color-theater-muted)', marginBottom: '4px' }}>
                as <em>{winnerCharacter}</em>
              </p>
            )}
            {script?.title && (
              <p style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: '16px', color: 'var(--color-stage-gold)', marginTop: '8px',
              }}>
                {script.title}
              </p>
            )}
            <p style={{ fontSize: '13px', color: 'var(--color-theater-muted)', marginTop: '4px' }}>
              {winner.votes} vote{winner.votes !== 1 ? 's' : ''}
            </p>
          </motion.div>
        ) : (
          <motion.div className="mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <motion.div className="mx-auto mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_BOUNCY}>
              <StarIcon size={48} color="var(--color-stage-gold)" />
            </motion.div>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700,
              color: 'var(--color-theater-text)', marginBottom: '8px',
            }}>
              Performance Complete!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-theater-muted)' }}>Great show!</p>
          </motion.div>
        )}

        {/* Poster — full-width with shimmer */}
        {scriptImageUrl && (
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
              <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" className="w-full block" style={{ borderRadius: '16px' }} onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none' }} />
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
              fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em',
              color: 'rgba(155, 149, 144, 0.4)', marginBottom: '12px',
            }}>
              THE CAST
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {castList.map((c) => (
                <div key={c.name} className="text-center">
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(253, 252, 250, 0.7)' }}>{c.name}</p>
                  {c.character && (
                    <p style={{ fontSize: '10px', fontStyle: 'italic', color: 'rgba(155, 149, 144, 0.4)' }}>
                      as {c.character}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share Results — primary: white bg, dark text */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button variant="primary" size="lg" fullWidth onClick={handleShareScript} style={{ background: '#ffffff', color: 'var(--color-void)' }}>
            Share Results
          </Button>
        </motion.div>

        {/* Read Script + Share Character — secondary: dark bg, muted text, subtle border */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button variant="secondary" size="md" className="flex-1" onClick={handleCopyScript} style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}>
            {copySuccess ? 'Copied!' : 'Script'}
          </Button>
          <Button variant="secondary" size="md" className="flex-1" onClick={handleShareCharacter} style={{ color: 'var(--color-theater-muted)', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}>
            Share Character
          </Button>
        </motion.div>

        {/* XP Progression */}
        <XPGainAnimation events={xpEvents} show={xpEvents.length > 0} />
        {levelInfo && (
          <motion.div className="w-full max-w-sm mx-auto mt-3 mb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <XPBar levelInfo={levelInfo} compact />
          </motion.div>
        )}
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={() => setLevelUpData(null)} />

        {/* Director's Review */}
        {directorsReview && (
          <div className="flex justify-center mb-6">
            <DirectorsReview review={directorsReview} delay={1.0} />
          </div>
        )}

        {/* Watch Replay + Browse */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={async () => {
              const gameId = await getGameId()
              if (!gameId) return
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const shareResponse: any = await withTimeout(
                  (cb) => socketManager.emit('share_game', gameId, cb),
                  10000
                )
                if (shareResponse.success && shareResponse.shareUrl) {
                  const code = shareResponse.shareUrl.split('/replay/')[1]
                  if (code) router.push(`/replay/${code}`)
                }
              } catch { /* noop */ }
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

        {/* Guest signup nudge */}
        {isGuest && (
          <motion.div
            className="w-full rounded-2xl p-6 text-center mb-6"
            style={{
              background: 'var(--color-highlight)',
              border: '2px dashed var(--color-accent)',
              maxWidth: '420px',
              margin: '0 auto 24px',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <p className="font-display text-xl" style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Great performance!</p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Sign up to keep your stats, XP, and unlock achievements
            </p>
            <SignInButton mode="redirect">
              <Button variant="primary" size="md">
                Create Account
              </Button>
            </SignInButton>
          </motion.div>
        )}

        {/* Waiting for host */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Card padding="lg" className="text-center" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(155, 149, 144, 0.2)' }}>
            <motion.div className="flex justify-center mb-3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <SpinnerIcon size={32} color="var(--color-theater-muted)" />
            </motion.div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-theater-text)', marginBottom: '4px' }}>Waiting for Host</p>
            <p style={{ fontSize: '14px', color: 'var(--color-theater-muted)', marginBottom: '16px' }}>The host will start the next round</p>
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                icon={<DoorIcon size={16} color="currentColor" />}
                onClick={() => router.push('/')}
                style={{ color: 'var(--color-theater-muted)', background: 'transparent' }}
              >
                Leave Game
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Poster Lightbox — now self-contained */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" style={{ maxHeight: '75dvh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
