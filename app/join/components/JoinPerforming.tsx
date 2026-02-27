'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { Script, PlayerRole, SpectatorMessage } from '@/lib/types'
import { MobileTeleprompter } from '@/components/MobileTeleprompter'
import { SpectatorChat } from '@/components/SpectatorChat'
import { VARIANTS } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false, loading: () => <div style={{ height: 48 }} /> })

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface JoinPerformingProps {
  script: Script
  currentLineIndex: number
  myCharacter: string
  myRole: PlayerRole
  roomCode: string
  spectatorMessages: SpectatorMessage[]
  socket: AppSocket | null
  onNextLine: () => void
  onPreviousLine: () => void
}

export function JoinPerforming({
  script, currentLineIndex, myCharacter, myRole, roomCode,
  spectatorMessages, socket, onNextLine, onPreviousLine,
}: JoinPerformingProps) {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <motion.div
      key="performing"
      variants={VARIANTS.curtainRise}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-dvh flex flex-col"
      style={{ maxWidth: isDesktop ? '900px' : undefined, margin: isDesktop ? '0 auto' : undefined }}
    >
      {/* Header bar: LIVE / Title / Line count or Spectating */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4CAF50' }}>LIVE</span>
        </div>
        <span className="font-display font-bold truncate mx-4" style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
          {script.title}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
          {myRole === 'SPECTATOR' ? '◎ Spectating' : `Line ${currentLineIndex + 1}/${script.lines.length}`}
        </span>
      </div>

      <AudienceReactionBar roomCode={roomCode.toUpperCase()} isPerforming={true} isHost={false} />
      <PlotTwistVoting roomCode={roomCode.toUpperCase()} isHost={false} />

      {myRole === 'SPECTATOR' && (
        <div className="mb-3 px-4" style={{ maxWidth: isDesktop ? '600px' : undefined, margin: isDesktop ? '0 auto' : undefined }}>
          <SpectatorChat
            messages={spectatorMessages}
            onSendMessage={(text, isPreset) => {
              socket?.emit('send_spectator_message', roomCode.toUpperCase(), text, isPreset)
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
    </motion.div>
  )
}
