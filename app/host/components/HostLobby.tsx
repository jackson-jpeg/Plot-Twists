'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import type { Player, RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'
import { ScriptCustomizationPanel } from '@/components/ScriptCustomizationPanel'
import { CardPackSelector } from '@/components/CardPackSelector'
import { AudioSettingsPanel } from '@/components/AudioSettingsPanel'
import { MOTION } from '@/lib/animations'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface HostLobbyProps {
  roomCode: string
  joinUrl: string
  isConnected: boolean
  players: Player[]
  settings: RoomSettings
  creditBalance: { free: number; banked: number; total: number } | null
  gameSetupMode: 'quick' | 'custom'
  selectedPackId: string
  scriptCustomization: ScriptCustomization
  audioSettings: AudioSettings
  socket: AppSocket | null
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  onStartGame: () => void
  onToggleMature: () => void
  onUpdateGameMode: (mode: GameMode) => void
  onSetupModeChange: (mode: 'quick' | 'custom') => void
  onSetSelectedPackId: (id: string) => void
  onSetScriptCustomization: React.Dispatch<React.SetStateAction<ScriptCustomization>>
  onSetAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>
  onSetSettings: React.Dispatch<React.SetStateAction<RoomSettings>>
  onShowOnboarding: () => void
  onNavigateHome: () => void
}

export function HostLobby({
  roomCode, joinUrl, isConnected, players, settings,
  creditBalance, gameSetupMode, selectedPackId,
  scriptCustomization, audioSettings, socket, toast,
  onStartGame, onToggleMature, onUpdateGameMode,
  onSetupModeChange, onSetSelectedPackId,
  onSetScriptCustomization, onSetAudioSettings, onSetSettings,
  onShowOnboarding, onNavigateHome,
}: HostLobbyProps) {
  const nonHostPlayers = players.filter(p => !p.isHost)

  const canStartGame =
    settings.gameMode === 'SOLO' ||
    (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) ||
    (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)

  const getStartGameRequirement = () => {
    if (settings.gameMode === 'HEAD_TO_HEAD') {
      const needed = 2 - nonHostPlayers.length
      return `Need ${needed} more player${needed !== 1 ? 's' : ''} to start`
    }
    if (settings.gameMode === 'ENSEMBLE') {
      const needed = 3 - nonHostPlayers.length
      if (needed > 0) return `Need ${needed} more player${needed !== 1 ? 's' : ''} to start`
    }
    return ''
  }

  return (
    <>
      {/* Back Button */}
      <motion.button
        onClick={onNavigateHome}
        className="back-button"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="back-arrow">←</span>
        <span>Home</span>
      </motion.button>

      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-6">
            <motion.h1
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={MOTION.gentle}
              className="hero-title"
              style={{ marginBottom: 0 }}
            >
              Plot Twists
            </motion.h1>
            <motion.button
              onClick={onShowOnboarding}
              className="btn btn-ghost mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>❓</span>
              <span>How to Play</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
          >
            {roomCode ? (
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Share this code with players:</p>
                  <div className={`connection-indicator ${isConnected ? 'connection-indicator-connected' : 'connection-indicator-disconnected'}`}>
                    <span aria-label={isConnected ? 'Connected: Room Active' : 'Disconnected: Reconnecting'}>{isConnected ? '🟢 Room Active' : '🔴 Reconnecting...'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="room-code-display">{roomCode}</div>
                  <motion.button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(joinUrl)
                        successHaptic()
                        toast.success('Link copied!')
                      } catch { toast.error('Failed to copy') }
                    }}
                    className="btn btn-ghost p-3"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Copy join link"
                    aria-label="Copy join link"
                  >
                    <span className="text-xl">📋</span>
                  </motion.button>
                </div>
                {creditBalance && (
                  <div className="mt-2 text-sm font-semibold" style={{
                    color: creditBalance.total === 0 ? 'var(--color-danger, #f87171)'
                      : creditBalance.free > 0 ? 'var(--color-success, #4ade80)' : '#facc15'
                  }}>
                    {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''} remaining
                  </div>
                )}
              </>
            ) : (
              <div className="skeleton" style={{ width: '280px', height: '88px', display: 'inline-block' }} />
            )}
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* QR Card */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', delay: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span className="text-4xl" initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={MOTION.spring}>📱</motion.span>
              <h2 className="text-2xl font-display" style={{ color: 'var(--color-text-primary)' }}>Scan to Join</h2>
            </div>
            {joinUrl ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="qr-wrapper"><QRCodeSVG value={joinUrl} size={180} level="H" /></div>
              </motion.div>
            ) : (
              <div className="skeleton" style={{ width: '228px', height: '228px' }} />
            )}
            <motion.p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              Or visit <span className="font-script font-bold" style={{ color: 'var(--color-text-primary)' }}>plot-twists.com</span>
            </motion.p>
            {settings.gameMode !== 'SOLO' && (
              <motion.div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Players joined</span>
                  <span className="text-sm font-semibold" style={{
                    color: (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) || (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)
                      ? 'var(--color-success)' : 'var(--color-text-secondary)'
                  }}>
                    {nonHostPlayers.length}/{settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 3}+
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length >= 2) || (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)
                        ? 'var(--color-success)' : 'var(--color-accent)'
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min((nonHostPlayers.length / (settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 3)) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Players Card */}
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', delay: 0.25 }} className="card card-accent">
            <div className="split mb-6">
              <div className="flex items-center gap-3">
                <motion.span className="text-4xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>🎭</motion.span>
                <h2 className="text-2xl font-display" style={{ color: 'var(--color-text-primary)' }}>Players</h2>
              </div>
              <motion.div key={nonHostPlayers.length} className="badge badge-accent" initial={{ scale: 0 }} animate={{ scale: [1.3, 1] }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                {nonHostPlayers.length}
              </motion.div>
            </div>
            <div className="relative">
            <div className="stack-sm max-h-80 overflow-y-auto" style={{ maskImage: nonHostPlayers.length > 4 ? 'linear-gradient(to bottom, black 85%, transparent 100%)' : undefined, WebkitMaskImage: nonHostPlayers.length > 4 ? 'linear-gradient(to bottom, black 85%, transparent 100%)' : undefined }}>
              <AnimatePresence mode="popLayout">
                {nonHostPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 150, delay: index * 0.05 }}
                    className="card-interactive flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--color-surface-alt)' }}
                  >
                    <div className="player-avatar">{player.nickname[0]?.toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                        {player.nickname}
                        {player.level != null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-purple-bg)', color: 'var(--color-purple)' }}>
                            Lv.{player.level}
                          </span>
                        )}
                      </p>
                      {player.hasSubmittedSelection && (
                        <motion.p className="text-xs font-medium" style={{ color: 'var(--color-success)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={MOTION.spring}>✓ Ready</motion.p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {nonHostPlayers.length === 0 && settings.gameMode !== 'SOLO' && (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.p className="empty-state-icon" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}>📱</motion.p>
                  <p className="empty-state-description text-sm mb-2">Waiting for players to join...</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Share the room code or scan the QR</p>
                </motion.div>
              )}
              {nonHostPlayers.length === 0 && settings.gameMode === 'SOLO' && (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.p className="empty-state-icon" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>🎤</motion.p>
                  <p className="empty-state-description text-sm mb-2">You're the star!</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Click "Start Solo Game" when ready</p>
                </motion.div>
              )}
            </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div className="stack-sm" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          {/* Quick/Custom Tabs */}
          <div className="card">
            <div className="flex gap-2 mb-4">
              <motion.button
                onClick={() => onSetupModeChange('quick')}
                className="btn flex-1"
                style={{
                  background: gameSetupMode === 'quick' ? 'var(--color-success)' : 'var(--color-surface-alt)',
                  color: gameSetupMode === 'quick' ? 'white' : 'var(--color-text-secondary)',
                  border: gameSetupMode === 'quick' ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>⚡</span><span>Quick Game</span>
              </motion.button>
              <motion.button
                onClick={() => onSetupModeChange('custom')}
                className="btn flex-1"
                style={{
                  background: gameSetupMode === 'custom' ? 'var(--color-purple)' : 'var(--color-surface-alt)',
                  color: gameSetupMode === 'custom' ? 'white' : 'var(--color-text-secondary)',
                  border: gameSetupMode === 'custom' ? '2px solid var(--color-purple)' : '1px solid var(--color-border)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🎛️</span><span>Custom Game</span>
              </motion.button>
            </div>
            <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {gameSetupMode === 'quick' ? 'Recommended settings for fast setup' : 'Customize all game options'}
            </p>
          </div>

          {/* Game Mode Selection */}
          <div className="card">
            <h3 className="font-display text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>🎮 Game Mode</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {([
                { mode: 'SOLO' as const, icon: '🎤', label: 'Solo', desc: '1 player vs AI', sublabel: '' },
                { mode: 'HEAD_TO_HEAD' as const, icon: '⚔️', label: 'Head-to-Head', desc: '2 performers + host', sublabel: 'Host runs the teleprompter' },
                { mode: 'ENSEMBLE' as const, icon: '🎭', label: 'Ensemble', desc: '3-6 performers + host', sublabel: 'Host runs the teleprompter' },
              ]).map(({ mode, icon, label, desc, sublabel }) => (
                <motion.button
                  key={mode}
                  onClick={() => onUpdateGameMode(mode)}
                  className={`card ${settings.gameMode === mode ? 'card-accent' : ''}`}
                  style={{
                    padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'visible',
                    border: settings.gameMode === mode ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: settings.gameMode === mode ? 'var(--color-highlight)' : 'var(--color-surface)'
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {gameSetupMode === 'quick' && mode === 'ENSEMBLE' && (
                    <div className="badge badge-success" style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '9px', padding: '2px 6px' }}>Recommended</div>
                  )}
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{desc}</div>
                  {sublabel && <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{sublabel}</div>}
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {settings.gameMode === 'SOLO' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Solo Mode Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>You'll pick cards and the AI will create a scene with you as the star. AI characters from the setting will join your performance!</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {settings.gameMode === 'HEAD_TO_HEAD' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚔️</span>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Head-to-Head Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Two performers go head-to-head with the same setup but different twists. Host controls the teleprompter while they compete for MVP.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {settings.gameMode === 'ENSEMBLE' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎭</span>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Ensemble Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>The whole group picks characters and performs together. Host keeps the show running on the big screen.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Rating */}
          {gameSetupMode === 'quick' && (
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{settings.isMature ? '🔞' : '👨‍👩‍👧‍👦'}</span>
                  <div>
                    <h3 className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{settings.isMature ? 'Adult themes, mature humor' : 'Fun for all ages'}</p>
                  </div>
                </div>
                <motion.button onClick={onToggleMature} className="btn btn-secondary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Switch</motion.button>
              </div>
            </motion.div>
          )}

          {/* Custom settings */}
          {gameSetupMode === 'custom' && (
            <>
              <div className="card split">
                <div>
                  <h3 className="font-display text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{settings.isMature ? '🔞 After Dark' : '👨‍👩‍👧‍👦 Family Friendly'}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Content Rating</p>
                </div>
                <motion.button onClick={onToggleMature} className={settings.isMature ? 'btn btn-ghost' : 'btn btn-secondary'} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Switch Mode</motion.button>
              </div>
              <CardPackSelector roomCode={roomCode} selectedPackId={selectedPackId} onSelect={onSetSelectedPackId} showCreateButton={true} />
              <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Quick Themes</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: 'Horror Comedy', icon: '👻', style: 'dark' as const, mature: false },
                    { label: 'Kids Party', icon: '🎈', style: 'slapstick' as const, mature: false },
                    { label: 'Office Shenanigans', icon: '💼', style: 'sitcom' as const, mature: false },
                    { label: 'After Hours', icon: '🌙', style: 'dark' as const, mature: true },
                  ].map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => {
                        onSetScriptCustomization(prev => ({ ...prev, comedyStyle: theme.style }))
                        if (theme.mature !== settings.isMature) {
                          const newSettings = { ...settings, isMature: theme.mature }
                          onSetSettings(newSettings)
                          socket?.emit('update_room_settings', roomCode, { isMature: theme.mature })
                        }
                        toast.success(`${theme.icon} ${theme.label} theme activated!`)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                    >
                      {theme.icon} {theme.label}
                    </button>
                  ))}
                </div>
              </div>
              <ScriptCustomizationPanel customization={scriptCustomization} onChange={onSetScriptCustomization} />
              <AudioSettingsPanel settings={audioSettings} onChange={onSetAudioSettings} />
            </>
          )}

          {/* Make Public Toggle */}
          {settings.gameMode !== 'SOLO' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{settings.isPublic ? '🌐' : '🔒'}</span>
                  <div>
                    <h3 className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>
                      {settings.isPublic ? 'Public Game' : 'Private Game'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {settings.isPublic ? 'Anyone can join from Quick Play' : 'Invite only via room code'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    const newPublic = !settings.isPublic
                    onSetSettings(prev => ({ ...prev, isPublic: newPublic }))
                    socket?.emit('update_room_settings', roomCode, { isPublic: newPublic })
                    tapHaptic()
                  }}
                  className="btn btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {settings.isPublic ? 'Make Private' : 'Make Public'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Start Game Button */}
          <motion.button
            onClick={() => { successHaptic(); onStartGame() }}
            disabled={!canStartGame}
            className="btn btn-primary btn-large w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={canStartGame ? {
              opacity: 1, y: 0,
              boxShadow: ['0 0 0 0 rgba(168, 85, 247, 0)', '0 0 20px 4px rgba(168, 85, 247, 0.4)', '0 0 0 0 rgba(168, 85, 247, 0)']
            } : { opacity: 0.6, y: 0 }}
            transition={canStartGame ? { boxShadow: { duration: 1.5, repeat: 2, ease: 'easeInOut' } } : {}}
            whileHover={canStartGame ? { scale: 1.02 } : {}}
            whileTap={canStartGame ? { scale: 0.98 } : {}}
          >
            <span>🎬</span>
            <span>{settings.gameMode === 'SOLO' ? 'Start Solo Game' : 'Start Game'}</span>
          </motion.button>
          <AnimatePresence>
            {!canStartGame && (
              <motion.p className="text-sm text-center mt-2" style={{ color: 'var(--color-text-tertiary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                {getStartGameRequirement()}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
