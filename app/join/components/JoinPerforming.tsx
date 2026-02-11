'use client'

import React from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { Script, PlayerRole, SpectatorMessage } from '@/lib/types'
import { MobileTeleprompter } from '@/components/MobileTeleprompter'
import { SpectatorChat } from '@/components/SpectatorChat'
import { VARIANTS } from '@/lib/animations'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

const AudienceReactionBar = dynamic(() => import('@/components/AudienceReactionBar').then(m => ({ default: m.AudienceReactionBar })), { ssr: false })
const PlotTwistVoting = dynamic(() => import('@/components/PlotTwistVoting').then(m => ({ default: m.PlotTwistVoting })), { ssr: false })

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
  return (
    <motion.div key="performing" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit">
      <AudienceReactionBar roomCode={roomCode.toUpperCase()} isPerforming={true} isHost={false} />
      <PlotTwistVoting roomCode={roomCode.toUpperCase()} isHost={false} />

      {myRole === 'SPECTATOR' && (
        <div className="mb-3">
          <SpectatorChat
            messages={spectatorMessages}
            onSendMessage={(text, isPreset) => {
              socket?.emit('send_spectator_message', roomCode.toUpperCase(), text, isPreset)
            }}
          />
        </div>
      )}

      <MobileTeleprompter
        script={script}
        currentLineIndex={currentLineIndex}
        myCharacter={myCharacter}
        onNextLine={onNextLine}
        onPreviousLine={onPreviousLine}
      />
    </motion.div>
  )
}
