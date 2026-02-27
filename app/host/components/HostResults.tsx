'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Script, GameResults, XPEvent, LevelInfo, DirectorsReview as DirectorsReviewType } from '@/lib/types'
import { downloadScript, copyScriptToClipboard, shareScriptText } from '@/lib/scriptUtils'
import { VARIANTS } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import { withTimeout } from '@/lib/socketTimeout'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
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
  onRequestSequel: () => void
  onRequestNewGame: (keepSelections: boolean) => void
}

export function HostResults({
  script, gameResults, scriptImageUrl, socket, userUid, toast,
  xpEvents, levelUpData, onDismissLevelUp,
  onShowPosterLightbox, onRequestSequel, onRequestNewGame,
}: HostResultsProps) {
  const router = useRouter()
  const { fireWinnerConfetti, fireCelebration } = useConfetti()
  const confettiFiredRef = useRef(false)
  const [copySuccess, setCopySuccess] = useState(false)
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

  const getGameId = async (): Promise<string | null> => {
    if (!socket || !userUid) return null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historyResponse: any = await withTimeout(
        (cb) => socket.emit('get_game_history', userUid, 1, cb),
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
      const cardUrl = `/api/character-card/${gameId}/${userUid}?format=story`

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
      style={{ background: '#1A1714' }}
    >
      <div className="w-full max-w-lg mx-auto px-5 py-6 flex flex-col flex-1">
        {/* Top bar: THAT'S A WRAP + Share */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className="font-display text-sm tracking-widest uppercase"
            style={{ color: '#9B9590', letterSpacing: '0.15em' }}
          >
            That&apos;s a Wrap
          </span>
          {script && (
            <motion.button
              onClick={handleShareScene}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                color: '#FDFCFA',
                background: 'transparent',
                border: '1px solid rgba(155, 149, 144, 0.35)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSharing}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
              <span>{isSharing ? 'Sharing...' : shareCopied ? 'Copied!' : 'Share'}</span>
            </motion.button>
          )}
        </motion.div>

        {/* Hero Poster */}
        <motion.div
          className="relative w-full rounded-2xl overflow-hidden mb-6"
          style={{ aspectRatio: '3/4', cursor: scriptImageUrl ? 'pointer' : undefined }}
          onClick={scriptImageUrl ? onShowPosterLightbox : undefined}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {scriptImageUrl && !posterError ? (
            <img
              src={scriptImageUrl}
              alt={`${script?.title ?? 'Movie'} Poster`}
              loading="lazy"
              onError={() => setPosterError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #2A1F3D, #1A1714)',
              }}
            />
          )}

          {/* Gradient overlay at bottom for text */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '55%',
              background: 'linear-gradient(to top, rgba(26,23,20,0.95) 0%, rgba(26,23,20,0.7) 40%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Title + production + cast overlaid at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px',
              pointerEvents: 'none',
            }}
          >
            <motion.h1
              className="font-display"
              style={{
                color: '#FDFCFA',
                fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 8,
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {script?.title ?? 'Performance Complete'}
            </motion.h1>
            <motion.p
              className="uppercase tracking-widest text-xs font-medium"
              style={{ color: '#9B9590', letterSpacing: '0.12em', marginBottom: 8 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              A Plot Twists Production
            </motion.p>
            {castNames.length > 0 && (
              <motion.p
                className="text-sm"
                style={{ color: 'rgba(155, 149, 144, 0.8)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {castNames.join('  /  ')}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* MVP line */}
        {winner && (
          <motion.div
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex-1 h-px" style={{ background: 'rgba(155, 149, 144, 0.2)' }} />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L11.5 6.1L17 6.9L13 10.8L13.9 16.3L9 13.7L4.1 16.3L5 10.8L1 6.9L6.5 6.1L9 1Z" fill="#F59E42" />
            </svg>
            <span className="font-display font-bold" style={{ color: '#F59E42' }}>
              {winner.playerName} is MVP
            </span>
            <span className="text-sm" style={{ color: '#9B9590' }}>
              {winner.votes} vote{winner.votes !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(155, 149, 144, 0.2)' }} />
          </motion.div>
        )}

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
          <motion.div className="w-full mt-4 mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <details className="rounded-xl overflow-hidden" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.15)' }}>
              <summary className="p-4 cursor-pointer text-center font-semibold text-sm" style={{ color: '#9B9590' }}>Game Highlights</summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {gameResults.highlights.map((h, i) => (
                  <motion.div key={h.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="text-center p-3 rounded-lg" style={{ background: 'rgba(253, 252, 250, 0.04)', border: '1px solid rgba(155, 149, 144, 0.1)' }}>
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="text-xs" style={{ color: '#9B9590' }}>{h.label}</div>
                    <div className="font-semibold text-sm" style={{ color: '#FDFCFA' }}>{h.value}</div>
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

        {/* Action pills: Save, Copy script, Replay */}
        {script && (
          <motion.div
            className="flex gap-3 mt-6 mb-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <motion.button
              onClick={handleDownloadScript}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{
                color: '#FDFCFA',
                background: 'rgba(253, 252, 250, 0.06)',
                border: '1px solid rgba(155, 149, 144, 0.2)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 10V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="#9B9590" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#9B9590" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Save
            </motion.button>
            <motion.button
              onClick={handleCopyScript}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{
                color: '#FDFCFA',
                background: 'rgba(253, 252, 250, 0.06)',
                border: '1px solid rgba(155, 149, 144, 0.2)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#9B9590" strokeWidth="1.5" />
                <path d="M11 5V3.5C11 2.67157 10.3284 2 9.5 2H3.5C2.67157 2 2 2.67157 2 3.5V9.5C2 10.3284 2.67157 11 3.5 11H5" stroke="#9B9590" strokeWidth="1.5" />
              </svg>
              {copySuccess ? 'Copied!' : 'Copy script'}
            </motion.button>
            <motion.button
              onClick={onRequestSequel}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{
                color: '#FDFCFA',
                background: 'rgba(253, 252, 250, 0.06)',
                border: '1px solid rgba(155, 149, 144, 0.2)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#9B9590" strokeWidth="1.5" />
                <path d="M8 5V8L10 10" stroke="#9B9590" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Replay
            </motion.button>
          </motion.div>
        )}

        {/* Share buttons (character + poster) */}
        <motion.div
          className="flex gap-3 mt-2 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            onClick={handleShareCharacter}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium"
            style={{
              color: '#9B9590',
              background: 'transparent',
              border: '1px solid rgba(155, 149, 144, 0.15)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Share Character
          </motion.button>
          <motion.button
            onClick={() => handleSharePoster('story')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium"
            style={{
              color: '#9B9590',
              background: 'transparent',
              border: '1px solid rgba(155, 149, 144, 0.15)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Share Poster
          </motion.button>
        </motion.div>

        {/* Spacer to push bottom actions down */}
        <div className="flex-1" />

        {/* Play again — large amber button */}
        <motion.button
          onClick={() => onRequestNewGame(false)}
          className="w-full py-4 rounded-2xl font-display text-lg font-bold"
          style={{
            background: '#F59E42',
            color: '#1A1714',
            border: 'none',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Play again
        </motion.button>

        {/* Back to lobby */}
        <motion.button
          onClick={() => router.push('/')}
          className="w-full py-4 text-sm font-medium"
          style={{
            color: '#9B9590',
            background: 'transparent',
            border: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Back to lobby
        </motion.button>
      </div>
    </motion.div>
  )
}
