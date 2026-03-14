'use client'

import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { PlayerRole } from '@/lib/types'
import { MobileTeleprompter } from '@/components/MobileTeleprompter'
import { SpectatorChat } from '@/components/SpectatorChat'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
import { SPRING_GENTLE } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { GamePausedOverlay } from '@/components/GamePausedOverlay'
import { useScriptStore } from '@/stores/scriptStore'
import { useAudienceStore } from '@/stores/audienceStore'
import { useGameStore } from '@/stores/gameStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { socketManager } from '@/lib/socketManager'

const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })

export interface JoinPerformingProps {
  myCharacter: string
  myRole: PlayerRole
  onShowPosterLightbox?: () => void
}

export function JoinPerforming({
  myCharacter, myRole, onShowPosterLightbox,
}: JoinPerformingProps) {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const script = useScriptStore((s) => s.script)
  const currentLineIndex = useScriptStore((s) => s.currentLineIndex)
  const scriptImageUrl = useScriptStore((s) => s.imageUrl)
  const spectatorMessages = useAudienceStore((s) => s.spectatorMessages)
  const roomCode = useGameStore((s) => s.roomCode)
  const hostDisconnected = useConnectionStore((s) => s.hostDisconnected)

  // Actions via socketManager
  const onNextLine = useCallback(() => {
    if (script && currentLineIndex < script.lines.length - 1) {
      socketManager.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex + 1)
    }
  }, [script, currentLineIndex, roomCode])

  const onPreviousLine = useCallback(() => {
    if (currentLineIndex > 0) {
      socketManager.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex - 1)
    }
  }, [currentLineIndex, roomCode])

  if (!script) return null

  return (
    <motion.div
      key="performing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING_GENTLE}
      className="min-h-dvh flex flex-col"
      style={{
        maxWidth: isDesktop ? '900px' : undefined,
        margin: isDesktop ? '0 auto' : undefined,
        background: 'var(--color-theater-bg)',
        color: 'var(--color-theater-text)',
      }}
    >
      {/* Header bar: LIVE / Title / Line count or Spectating */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>LIVE</span>
        </div>
        <span className="font-display font-bold truncate mx-4" style={{ fontSize: '15px', color: 'var(--color-theater-text)' }}>
          {script.title}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-theater-muted)', whiteSpace: 'nowrap' }}>
          {myRole === 'SPECTATOR' ? '◎ Spectating' : `Line ${currentLineIndex + 1}/${script.lines.length}`}
        </span>
      </div>

      {/* Poster — compact for mobile join view */}
      {scriptImageUrl && (
        <motion.div
          className="flex justify-center py-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <MoviePosterFrame
            imageUrl={scriptImageUrl}
            title={script.title}
            onClick={onShowPosterLightbox}
            maxWidth={isDesktop ? 280 : 200}
            showNowShowing={false}
            variant="performance"
          />
        </motion.div>
      )}

      <AudienceReactionBar roomCode={roomCode.toUpperCase()} isPerforming={true} isHost={false} />
      <PlotTwistVoting roomCode={roomCode.toUpperCase()} isHost={false} />

      {myRole === 'SPECTATOR' && (
        <div className="mb-3 px-4" style={{ maxWidth: isDesktop ? '600px' : undefined, margin: isDesktop ? '0 auto' : undefined }}>
          <SpectatorChat
            messages={spectatorMessages}
            onSendMessage={(text, isPreset) => {
              socketManager.emit('send_spectator_message', roomCode.toUpperCase(), text, isPreset)
            }}
          />
        </div>
      )}

      <div className="flex-1">
        <MobileTeleprompter
          script={script}
          currentLineIndex={currentLineIndex}
          myCharacter={myCharacter}
          onNextLine={onNextLine}
          onPreviousLine={onPreviousLine}
        />
      </div>

      <GamePausedOverlay visible={!!hostDisconnected} reason="Host disconnected" />
    </motion.div>
  )
}
