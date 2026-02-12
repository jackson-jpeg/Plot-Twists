'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { CardSelection, PlayerRole } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { MOTION } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import { useJoinSocket } from '@/hooks/useJoinSocket'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

import { JoinForm } from './components/JoinForm'
import { JoinLobby } from './components/JoinLobby'
import { JoinSelection } from './components/JoinSelection'
import { JoinLoading } from './components/JoinLoading'
import { JoinPerforming } from './components/JoinPerforming'
import { JoinVoting } from './components/JoinVoting'
import { JoinResults } from './components/JoinResults'

function JoinPageContent() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const toast = useToast()
  const achievementToasts = useAchievementToasts()
  const confetti = useConfetti()
  useWakeLock()
  useAudioPlayer({ socket, isConnected })

  const [roomCode, setRoomCode] = useState(codeFromUrl || '')
  const [hasJoined, setHasJoined] = useState(false)
  const [myPlayerId, setMyPlayerId] = useState('')
  const [myRole, setMyRole] = useState<PlayerRole>('PLAYER')
  const [roomIsMature, setRoomIsMature] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)

  // Card selection state (kept in orchestrator so socket actions can use it)
  const [selection, setSelection] = useState<CardSelection>({ character: '', setting: '', circumstance: '' })
  const [customInputActive, setCustomInputActive] = useState({ character: false, setting: false, circumstance: false })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)

  const {
    gameState,
    players,
    script,
    currentLineIndex,
    myCharacter,
    greenRoomQuestion,
    gameResults,
    availableCards,
    hostDisconnected, setHostDisconnected,
    selectedPackName,
    scriptImageUrl,
    countdown,
    spectatorMessages,
    loadingProgress,
    error,
  } = useJoinSocket({
    socket, isConnected, myPlayerId, myRole,
    selectionCharacter: selection.character,
    toast, achievementToasts,
  })

  // Auto-show onboarding for first-time users
  useEffect(() => {
    if (!localStorage.getItem('pt-onboarding-seen')) {
      setShowOnboarding(true)
      localStorage.setItem('pt-onboarding-seen', '1')
    }
  }, [])

  // Reset orchestrator state when returning to LOBBY (new game)
  useEffect(() => {
    if (gameState === 'LOBBY') {
      setSelection({ character: '', setting: '', circumstance: '' })
      setCustomInputActive({ character: false, setting: false, circumstance: false })
      setHasSubmitted(false)
      setIsSubmitting(false)
      setHasTriggeredSelectionConfetti(false)
    }
  }, [gameState])

  // Confetti on results
  useEffect(() => {
    if (gameState === 'RESULTS' && gameResults?.winner) {
      setTimeout(() => confetti.fireCelebration(), 500)
    }
  }, [gameState, gameResults, confetti])

  // Confetti when all cards selected
  useEffect(() => {
    if (selection.character && selection.setting && selection.circumstance &&
        !hasTriggeredSelectionConfetti && gameState === 'SELECTION' && !hasSubmitted) {
      setHasTriggeredSelectionConfetti(true)
      confetti.fireWinnerConfetti()
      toast.success('All cards selected! Ready to submit!')
    }
  }, [selection, hasTriggeredSelectionConfetti, gameState, hasSubmitted, confetti, toast])

  useEffect(() => {
    if (!selection.character && !selection.setting && !selection.circumstance) setHasTriggeredSelectionConfetti(false)
  }, [selection])

  // --- Actions ---
  const handleJoinSuccess = (data: { players: typeof players; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => {
    setHasJoined(true)
    setMyPlayerId(data.myPlayerId)
    setMyRole(data.myRole)
    setRoomCode(data.roomCode)
    setRoomIsMature(data.roomIsMature)
  }

  const handleSubmitCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards'); return
    }
    setIsSubmitting(true)
    socket.emit('submit_cards', roomCode, selection, (response) => {
      setIsSubmitting(false)
      if (response.success) { setHasSubmitted(true); toast.success('Cards submitted!') }
      else toast.error(response.error || 'Failed to submit cards')
    })
  }

  const handleVote = (playerId: string) => socket?.emit('submit_vote', roomCode, playerId)

  const goToNextLine = () => {
    if (script && currentLineIndex < script.lines.length - 1) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex + 1)
    }
  }

  const goToPreviousLine = () => {
    if (currentLineIndex > 0) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex - 1)
    }
  }

  if (!isConnected) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚡</div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="page-container items-center justify-center">
        <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />
        <JoinForm
          socket={socket} isConnected={isConnected}
          initialRoomCode={codeFromUrl || ''}
          toast={toast}
          onJoinSuccess={handleJoinSuccess}
          onShowOnboarding={() => setShowOnboarding(true)}
          onNavigateHome={() => router.push('/')}
        />
      </div>
    )
  }

  return (
    <div className="page-container">
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />

      {/* Host Disconnected Overlay */}
      <AnimatePresence>
        {hostDisconnected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full text-center">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>Host Disconnected</h2>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                The host has left the game. You can wait for them to reconnect or return to the home page.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button onClick={() => setHostDisconnected(false)} className="btn btn-secondary w-full"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Wait for Reconnection</motion.button>
                <motion.button onClick={() => router.push('/')} className="btn btn-primary w-full"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Return Home</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Performance Countdown */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={countdown}
                initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }} transition={MOTION.bouncy}
                className="text-center">
                <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: '18px', color: 'var(--color-text-tertiary)', marginTop: '16px' }}>Get ready to perform!</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`}
              style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} />
          </div>
        )}
      </Modal>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <JoinLobby key="lobby" players={players} myRole={myRole} selectedPackName={selectedPackName} />
        )}

        {gameState === 'SELECTION' && (
          <JoinSelection
            key="selection"
            myRole={myRole} hasSubmitted={hasSubmitted} isSubmitting={isSubmitting}
            selection={selection} setSelection={setSelection}
            customInputActive={customInputActive} setCustomInputActive={setCustomInputActive}
            availableCards={availableCards} roomIsMature={roomIsMature}
            error={error} onSubmitCards={handleSubmitCards} toast={toast}
          />
        )}

        {gameState === 'LOADING' && (
          <JoinLoading key="loading" loadingProgress={loadingProgress} greenRoomQuestion={greenRoomQuestion} />
        )}

        {gameState === 'PERFORMING' && script && (
          <JoinPerforming
            key="performing"
            script={script} currentLineIndex={currentLineIndex}
            myCharacter={myCharacter} myRole={myRole}
            roomCode={roomCode} spectatorMessages={spectatorMessages}
            socket={socket}
            onNextLine={goToNextLine} onPreviousLine={goToPreviousLine}
          />
        )}

        {gameState === 'VOTING' && (
          <JoinVoting key="voting" players={players} myPlayerId={myPlayerId} onVote={handleVote} />
        )}

        {gameState === 'RESULTS' && (
          <JoinResults
            key="results"
            script={script} gameResults={gameResults}
            scriptImageUrl={scriptImageUrl}
            showPosterLightbox={showPosterLightbox}
            onShowPosterLightbox={() => setShowPosterLightbox(true)}
            onClosePosterLightbox={() => setShowPosterLightbox(false)}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="page-container items-center justify-center">
        <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
