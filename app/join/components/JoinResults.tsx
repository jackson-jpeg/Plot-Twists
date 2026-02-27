'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo, DirectorsReview as DirectorsReviewType } from '@/lib/types'
import { SignInButton } from '@clerk/nextjs'
import { downloadScript, copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { withTimeout } from '@/lib/socketTimeout'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'
import { Modal } from '@/components/Modal'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { TrophyIcon, ShareIcon, CopyIcon, DoorIcon, StarIcon, MedalIcon, SpinnerIcon } from '@/components/GameIcons'
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

  const handleSharePoster = async (format: 'story' | 'feed' = 'story') => {
    const gameId = await getGameId()
    if (!gameId) return
    const posterUrl = `/api/poster-story/${gameId}?format=${format}`
    try {
      const response = await fetch(posterUrl)
      const blob = await response.blob()
      const file = new File([blob], `poster-${format}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: script?.title || 'Plot Twists' })
      } else {
        window.open(posterUrl, '_blank')
      }
    } catch {
      window.open(posterUrl, '_blank')
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
    <motion.div key="results" variants={VARIANTS.spotlight} initial="initial" animate="animate" exit="exit" style={{ padding: '24px 16px', background: 'var(--color-bg)' }}>
      <div className="w-full mx-auto text-center" style={{ maxWidth: isDesktop ? '720px' : '512px' }}>
        {gameResults?.winner ? (
          <>
            {/* Trophy */}
            <div className="relative inline-block mb-6">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
                animate={{ opacity: [0.2, 0.3, 0.2], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>
                <TrophyIcon size={80} color="var(--color-accent)" />
              </motion.div>
            </div>

            {/* Poster */}
            {scriptImageUrl && (
              <motion.div className="mx-auto mb-4 flex flex-col items-center" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ perspective: 1000 }}>
                <motion.div onClick={onShowPosterLightbox} className="cursor-pointer overflow-hidden" style={{ maxWidth: 200, borderRadius: 'var(--radius-xl, 16px)', border: '3px solid var(--color-accent)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <img src={scriptImageUrl} alt={`${script?.title} Poster`} loading="lazy" className="w-full block object-contain" style={{ aspectRatio: '2/3' }} />
                </motion.div>
                {script && <motion.p className="font-display text-base mt-2" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{script.title}</motion.p>}
              </motion.div>
            )}

            <motion.h1
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-title)', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '6px' }}
              variants={VARIANTS.drumRoll}
              initial="initial"
              animate="animate"
              aria-live="polite"
              aria-atomic="true"
            >
              {gameResults.winner.playerName} Wins!
            </motion.h1>
            <motion.p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '28px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
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
              <motion.div className="relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}>
                <StarIcon size={64} color="var(--color-accent-2)" />
              </motion.div>
            </div>

            {scriptImageUrl && (
              <motion.div className="mx-auto mb-4 flex flex-col items-center" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ perspective: 1000 }}>
                <motion.div onClick={onShowPosterLightbox} className="cursor-pointer overflow-hidden" style={{ maxWidth: 200, borderRadius: 'var(--radius-xl, 16px)', border: '3px solid var(--color-accent-2)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" className="w-full block object-contain" style={{ aspectRatio: '2/3' }} />
                </motion.div>
                {script && <motion.p className="font-display text-base mt-2" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{script.title}</motion.p>}
              </motion.div>
            )}

            <motion.h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '20px' }} initial={{ y: -20, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5, duration: 0.5 }}>Performance Complete!</motion.h1>
            <motion.p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '28px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>Thanks for playing!</motion.p>
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
              <motion.button
                onClick={handleShareScript}
                className="flex items-center gap-2"
                style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <ShareIcon size={16} color="currentColor" />
                <span>{'share' in navigator ? 'Share Script' : 'Save Script'}</span>
              </motion.button>
              <motion.button
                onClick={handleCopyScript}
                className="flex items-center gap-2"
                style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <CopyIcon size={16} color="currentColor" />
                <span>{copySuccess ? 'Copied!' : 'Copy Script'}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Share My Character + Share Poster */}
        <motion.div className={`flex ${isDesktop ? 'flex-row justify-center' : 'flex-col items-center'} gap-3 mb-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <motion.button
            onClick={handleShareCharacter}
            className="w-full"
            style={{
              maxWidth: '320px',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Share My Character
          </motion.button>
          <motion.button
            onClick={() => handleSharePoster('story')}
            className="w-full"
            style={{
              maxWidth: '320px',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Share Poster
          </motion.button>
        </motion.div>

        {/* Director's Review */}
        {directorsReview && (
          <div className="flex justify-center mb-6">
            <DirectorsReview review={directorsReview} delay={1.0} />
          </div>
        )}

        {/* Guest signup nudge */}
        {isGuest && (
          <motion.div
            className="w-full rounded-2xl p-6 text-center"
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
            <p
              className="font-display text-xl"
              style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}
            >
              Great performance!
            </p>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                marginBottom: '16px',
              }}
            >
              Sign up to keep your stats, XP, and unlock achievements
            </p>
            <SignInButton mode="redirect">
              <button
                style={{
                  background: 'var(--color-accent)',
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Create Account
              </button>
            </SignInButton>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                marginTop: '10px',
              }}
            >
              Free — takes 30 seconds
            </p>
          </motion.div>
        )}

        {/* Waiting for host */}
        <motion.div
          className="text-center p-6 rounded-xl"
          style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-accent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div className="flex justify-center mb-3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <SpinnerIcon size={32} color="var(--color-accent)" />
          </motion.div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Waiting for Host</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>The host will start the next round</p>
          <motion.button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 mx-auto"
            style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            whileTap={{ scale: 0.95 }}
          >
            <DoorIcon size={16} color="currentColor" />
            Leave Game
          </motion.button>
        </motion.div>
      </div>

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={onClosePosterLightbox} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`} loading="lazy" style={{ maxHeight: '75dvh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} />
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
                  <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.95 + index * 0.15 }}>
                    {index === 0 ? <MedalIcon size={isWinner ? 28 : 22} color="var(--color-accent)" /> : index === 1 ? <MedalIcon size={22} color="var(--color-accent-2)" /> : index === 2 ? <MedalIcon size={22} color="var(--color-border-strong)" /> : <StarIcon size={22} color="var(--color-text-tertiary)" />}
                  </motion.span>
                  <span style={{ fontSize: isWinner ? 18 : 16, fontWeight: isWinner ? 700 : 600, color: 'var(--color-text-primary)' }}>{result.playerName}</span>
                </div>
                <span style={{ fontSize: isWinner ? 18 : 16, fontWeight: 700, color: barColor }}>{result.votes}</span>
              </div>
              <div className="w-full rounded-full overflow-hidden relative" style={{ height: isWinner ? 12 : 8, background: 'var(--color-border)' }}>
                <motion.div className="h-full rounded-full relative overflow-hidden" style={{ background: barColor }}
                  initial={{ width: '0%' }} animate={{ width: `${maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}%` }}
                  transition={{ delay: 0.9 + index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                  {isWinner && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', animation: 'shimmer 1.5s ease-in-out infinite' }} />}
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
