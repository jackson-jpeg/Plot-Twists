'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo, DirectorsReview as DirectorsReviewType } from '@/lib/types'
import { SignInButton } from '@clerk/nextjs'
import { copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { withTimeout } from '@/lib/socketTimeout'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'
import { Modal } from '@/components/Modal'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DoorIcon, StarIcon, SpinnerIcon } from '@/components/GameIcons'
import { Button, Card } from '@/components/ui'
import { XPGainAnimation } from '@/components/XPGainAnimation'
import { XPBar } from '@/components/XPBar'
import { LevelUpCelebration } from '@/components/LevelUpCelebration'
import { DirectorsReview } from '@/components/DirectorsReview'
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
  isGuest?: boolean
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
  onDismissLevelUp: () => void
  onShowPosterLightbox: () => void
  onClosePosterLightbox: () => void
}

export function JoinResults({
  script, gameResults, scriptImageUrl,
  showPosterLightbox, socket, myPlayerId, userUid, isGuest,
  xpEvents, levelUpData, onDismissLevelUp,
  onShowPosterLightbox, onClosePosterLightbox,
}: JoinResultsProps) {
  const router = useRouter()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const { fireWinnerConfetti, fireCelebration } = useConfetti()
  const confettiFiredRef = useRef(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [directorsReview, setDirectorsReview] = useState<DirectorsReviewType | null>(null)

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
    if (!socket || !uid) return
    socket.emit('get_progression', uid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
  }, [socket, userUid, myPlayerId])

  // Listen for AI Director's Review
  useEffect(() => {
    if (!socket) return
    socket.on('directors_review', setDirectorsReview)
    return () => { socket.off('directors_review', setDirectorsReview) }
  }, [socket])

  const getGameId = async (): Promise<string | null> => {
    const uid = userUid || myPlayerId
    if (!socket || !uid) return null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyResponse: any = await withTimeout(
        (cb) => socket.emit('get_game_history', uid, 1, cb),
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

  return (
    <motion.div key="results" variants={VARIANTS.spotlight} initial="initial" animate="animate" exit="exit" style={{ padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px', background: 'var(--color-bg)' }}>
      <div className="w-full mx-auto text-center" style={{ maxWidth: isDesktop ? '720px' : '512px' }}>
        {/* MVP Hero — star + label + name */}
        {gameResults?.winner ? (
          <motion.div
            className="mb-6"
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
              transition={{ ...MOTION.bouncy, delay: 0.3 }}
            >
              <svg width="48" height="48" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L11.5 6.1L17 6.9L13 10.8L13.9 16.3L9 13.7L4.1 16.3L5 10.8L1 6.9L6.5 6.1L9 1Z" fill="var(--color-accent)" />
              </svg>
            </motion.div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.15em' }}
            >
              Most Valuable Player
            </p>
            <h1
              className="font-display"
              style={{ fontSize: isDesktop ? '42px' : '36px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1.1, marginBottom: '6px' }}
            >
              {gameResults.winner.playerName}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
            </p>
          </motion.div>
        ) : (
          <motion.div className="mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <motion.div className="mx-auto mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={MOTION.bouncy}>
              <StarIcon size={48} color="var(--color-accent-2)" />
            </motion.div>
            <h1 className="font-display" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Performance Complete!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Great show!</p>
          </motion.div>
        )}

        {/* Poster — constrained ~300px */}
        {scriptImageUrl && (
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
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" className="w-full block" style={{ borderRadius: '16px' }} onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none' }} />
          </motion.div>
        )}

        {/* Share Results — full-width accent */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button variant="primary" size="lg" fullWidth onClick={handleShareScript}>
            Share Results
          </Button>
        </motion.div>

        {/* Read Script + secondary button */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button variant="secondary" size="md" className="flex-1" onClick={handleCopyScript} style={{ background: 'transparent' }}>
            {copySuccess ? 'Copied!' : 'Read Script'}
          </Button>
          <Button variant="secondary" size="md" className="flex-1" onClick={handleShareCharacter} style={{ background: 'transparent' }}>
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
        <LevelUpCelebration show={!!levelUpData} level={levelUpData?.level ?? 0} title={levelUpData?.title ?? ''} onClose={onDismissLevelUp} />

        {/* Director's Review */}
        {directorsReview && (
          <div className="flex justify-center mb-6">
            <DirectorsReview review={directorsReview} delay={1.0} />
          </div>
        )}

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
          <Card padding="lg" className="text-center" style={{ background: 'var(--color-highlight)', borderColor: 'var(--color-accent)' }}>
            <motion.div className="flex justify-center mb-3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <SpinnerIcon size={32} color="var(--color-accent)" />
            </motion.div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Waiting for Host</p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>The host will start the next round</p>
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                icon={<DoorIcon size={16} color="currentColor" />}
                onClick={() => router.push('/')}
                style={{ background: 'transparent' }}
              >
                Leave Game
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={onClosePosterLightbox} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" style={{ maxHeight: '75dvh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

