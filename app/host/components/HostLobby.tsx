'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false, loading: () => <div className="animate-pulse" style={{ width: 140, height: 140, borderRadius: '8px', background: 'var(--color-surface-alt)' }} /> })
import type { Player, RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'
const ScriptCustomizationPanel = dynamic(() => import('@/components/ScriptCustomizationPanel').then(m => ({ default: m.ScriptCustomizationPanel })), { ssr: false, loading: () => null })
const CardPackSelector = dynamic(() => import('@/components/CardPackSelector').then(m => ({ default: m.CardPackSelector })), { ssr: false, loading: () => null })
const AudioSettingsPanel = dynamic(() => import('@/components/AudioSettingsPanel').then(m => ({ default: m.AudioSettingsPanel })), { ssr: false, loading: () => null })
import { MOTION, VARIANTS } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
import { getAvatarColor } from '@/lib/avatarColors'
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

function CopyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 6V4.5C14 3.67 13.33 3 12.5 3H5.5C4.67 3 4 3.67 4 4.5V14.5C4 15.33 4.67 16 5.5 16H6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ChevronIcon({ size = 16, direction = 'down' }: { size?: number; direction?: 'down' | 'up' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const nonHostPlayers = players.filter(p => !p.isHost)

  const canStartGame =
    settings.gameMode === 'SOLO' ||
    (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) ||
    (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)

  const getMinPlayers = () => {
    if (settings.gameMode === 'HEAD_TO_HEAD') return 2
    if (settings.gameMode === 'ENSEMBLE') return 3
    return 0
  }

  const getWaitingText = () => {
    const minPlayers = getMinPlayers()
    if (minPlayers === 0) return ''
    const needed = minPlayers - nonHostPlayers.length
    if (needed <= 0) return ''
    return `Waiting for ${needed} more player${needed !== 1 ? 's' : ''}...`
  }

  const getNeededText = () => {
    if (settings.gameMode === 'SOLO') return ''
    const min = getMinPlayers()
    return `${nonHostPlayers.length} of ${min} needed`
  }

  // --- Shared sub-sections ---

  const roomCodeSection = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <p style={{
        fontSize: 'var(--text-label)',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: 'var(--color-text-tertiary)',
        marginBottom: '8px',
        textAlign: isDesktop ? 'left' : 'center',
      }}>
        Room Code
      </p>
      {roomCode ? (
        <>
          <div className="flex items-center gap-3" style={{ justifyContent: isDesktop ? 'flex-start' : 'center' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: isDesktop ? '80px' : '64px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '0.04em',
              color: 'var(--color-text-primary)',
            }}>
              {roomCode}
            </span>
            <motion.button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(joinUrl)
                  successHaptic()
                  toast.success('Link copied!')
                } catch { toast.error('Failed to copy') }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
                padding: '8px',
                marginTop: '8px',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Copy join link"
              aria-label="Copy join link"
            >
              <CopyIcon size={22} />
            </motion.button>
          </div>
          <p style={{
            fontSize: 'var(--text-caption)',
            marginTop: '4px',
            color: 'var(--color-text-tertiary)',
            textAlign: isDesktop ? 'left' : 'center',
          }}>
            Share this code with your friends
          </p>
          {creditBalance && (
            <p style={{
              fontSize: 'var(--text-caption)',
              marginTop: '6px',
              color: creditBalance.total === 0 ? 'var(--color-danger)' : 'var(--color-text-tertiary)',
              textAlign: isDesktop ? 'left' : 'center',
            }}>
              {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''} remaining
            </p>
          )}
        </>
      ) : (
        <div className="animate-pulse" style={{ width: '280px', height: '72px', display: 'inline-block', borderRadius: 12, background: 'var(--color-surface-alt)' }} />
      )}
    </motion.div>
  )

  const qrSection = (
    <motion.div
      className="flex items-center gap-5 rounded-xl"
      style={{
        padding: '20px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        marginTop: '24px',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {joinUrl ? (
        <div className="flex-shrink-0 rounded-lg overflow-hidden p-2" style={{ background: 'var(--color-surface-alt)' }}>
          <QRCodeSVG value={joinUrl} size={isDesktop ? 140 : 120} level="H" />
        </div>
      ) : (
        <div className="animate-pulse flex-shrink-0" style={{ width: '136px', height: '136px', borderRadius: '8px', background: 'var(--color-surface-alt)' }} />
      )}
      <div>
        <p style={{
          fontWeight: 700,
          fontSize: '17px',
          color: 'var(--color-text-primary)',
          marginBottom: '4px',
        }}>
          Scan to join
        </p>
        <p style={{
          fontSize: 'var(--text-caption)',
          lineHeight: 1.5,
          color: 'var(--color-text-secondary)',
        }}>
          Or go to <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>plot-twists.com</span> and enter the code above
        </p>
      </div>
    </motion.div>
  )

  const playersSection = settings.gameMode !== 'SOLO' ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Players header */}
      <div className="flex items-center justify-between mb-3">
        <p style={{
          fontSize: 'var(--text-label)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'var(--color-text-tertiary)',
        }}>
          Players ({nonHostPlayers.length})
        </p>
        <p style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-text-tertiary)',
        }}>
          Max {settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 8}
        </p>
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {nonHostPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22, delay: index * 0.06 }}
            >
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <motion.div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: getAvatarColor(player.nickname),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 'var(--text-body)',
                    flexShrink: 0,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.06 + 0.1 }}
                >
                  {player.nickname[0]?.toUpperCase()}
                </motion.div>

                <div className="flex-1">
                  <p style={{
                    fontWeight: 600,
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-primary)',
                  }}>
                    {player.nickname}
                  </p>
                </div>

                {player.level != null ? (
                  <span style={{
                    fontSize: 'var(--text-caption)',
                    fontWeight: 500,
                    color: 'var(--color-text-tertiary)',
                  }}>
                    Lv.{player.level}
                  </span>
                ) : (
                  <span style={{
                    fontSize: 'var(--text-caption)',
                    fontWeight: 500,
                    color: player.hasSubmittedSelection ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                  }}>
                    {player.hasSubmittedSelection ? 'Ready' : 'Joined'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!canStartGame && getWaitingText() && (
          <motion.p
            className="text-center py-5"
            style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {getWaitingText()}
          </motion.p>
        )}
      </div>
    </motion.div>
  ) : (
    <motion.div
      className="py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Solo mode — you are the star performer. Press Start Game when ready.
      </p>
    </motion.div>
  )

  const settingsSection = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <button
        onClick={() => setSettingsOpen(prev => !prev)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        <span>Game Settings</span>
        <ChevronIcon size={16} direction={settingsOpen ? 'up' : 'down'} />
      </button>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={MOTION.gentle}
            style={{ overflow: 'hidden' }}
            className="mt-3"
          >
            <div className="flex flex-col gap-4">
              {/* Quick/Custom Tabs */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex gap-2 mb-3">
                  <motion.button
                    onClick={() => onSetupModeChange('quick')}
                    className="flex-1"
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-button)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: gameSetupMode === 'quick' ? 'var(--color-success)' : 'var(--color-surface-alt)',
                      color: gameSetupMode === 'quick' ? 'white' : 'var(--color-text-secondary)',
                      border: gameSetupMode === 'quick' ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Quick Game
                  </motion.button>
                  <motion.button
                    onClick={() => onSetupModeChange('custom')}
                    className="flex-1"
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-button)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: gameSetupMode === 'custom' ? 'var(--color-accent)' : 'var(--color-surface-alt)',
                      color: gameSetupMode === 'custom' ? 'white' : 'var(--color-text-secondary)',
                      border: gameSetupMode === 'custom' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Custom Game
                  </motion.button>
                </div>
                <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {gameSetupMode === 'quick' ? 'Recommended settings for fast setup' : 'Customize all game options'}
                </p>
              </div>

              {/* Game Mode Selection */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>Game Mode</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {([
                    { mode: 'SOLO' as const, label: 'Solo', desc: '1 player vs AI', sublabel: '' },
                    { mode: 'HEAD_TO_HEAD' as const, label: 'Head-to-Head', desc: '2 performers + host', sublabel: 'Host runs the teleprompter' },
                    { mode: 'ENSEMBLE' as const, label: 'Ensemble', desc: '3-6 performers + host', sublabel: 'Host runs the teleprompter' },
                  ]).map(({ mode, label, desc, sublabel }) => (
                    <motion.button
                      key={mode}
                      onClick={() => onUpdateGameMode(mode)}
                      style={{
                        padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'visible',
                        borderRadius: 'var(--radius-card)', textAlign: 'left',
                        border: settings.gameMode === mode ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        background: settings.gameMode === mode ? 'var(--color-highlight)' : 'var(--color-surface-alt)'
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {gameSetupMode === 'quick' && mode === 'ENSEMBLE' && (
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '9px', padding: '2px 6px', borderRadius: '999px', background: 'var(--color-success)', color: 'white', fontWeight: 700 }}>Recommended</div>
                      )}
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>{label}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{desc}</div>
                      {sublabel && <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{sublabel}</div>}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {settings.gameMode === 'SOLO' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Solo Mode Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>You'll pick cards and the AI will create a scene with you as the star. AI characters from the setting will join your performance!</p>
                    </motion.div>
                  )}
                  {settings.gameMode === 'HEAD_TO_HEAD' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Head-to-Head Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Two performers go head-to-head with the same setup but different twists. Host controls the teleprompter while they compete for MVP.</p>
                    </motion.div>
                  )}
                  {settings.gameMode === 'ENSEMBLE' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>How Ensemble Works</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>The whole group picks characters and performs together. Host keeps the show running on the big screen.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content Rating */}
              {gameSetupMode === 'quick' && (
                <motion.div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{settings.isMature ? 'Adult themes, mature humor' : 'Fun for all ages'}</p>
                    </div>
                    <motion.button
                      onClick={onToggleMature}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-button)', border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', fontWeight: 600, cursor: 'pointer' }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      Switch
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Custom settings */}
              {gameSetupMode === 'custom' && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Content Rating</p>
                    </div>
                    <motion.button
                      onClick={onToggleMature}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-button)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', fontWeight: 600, cursor: 'pointer' }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      Switch Mode
                    </motion.button>
                  </div>
                  <CardPackSelector roomCode={roomCode} selectedPackId={selectedPackId} onSelect={onSetSelectedPackId} showCreateButton={true} />
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Quick Themes</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { label: 'Horror Comedy', style: 'dark' as const, mature: false },
                        { label: 'Kids Party', style: 'slapstick' as const, mature: false },
                        { label: 'Office Shenanigans', style: 'sitcom' as const, mature: false },
                        { label: 'After Hours', style: 'dark' as const, mature: true },
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
                            toast.success(`${theme.label} theme activated!`)
                          }}
                          className="px-3 py-2.5 rounded-lg text-sm transition-all"
                          style={{ border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', minHeight: '44px' }}
                        >
                          {theme.label}
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
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {settings.isPublic ? 'Public Game' : 'Private Game'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {settings.isPublic ? 'Anyone can join from Quick Play' : 'Invite only via room code'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => {
                      const newPublic = !settings.isPublic
                      onSetSettings(prev => ({ ...prev, isPublic: newPublic }))
                      socket?.emit('update_room_settings', roomCode, { isPublic: newPublic })
                      tapHaptic()
                    }}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-button)', border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-caption)', fontWeight: 600, cursor: 'pointer' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {settings.isPublic ? 'Make Private' : 'Make Public'}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const startButton = (
    <motion.button
      onClick={() => { successHaptic(); onStartGame() }}
      disabled={!canStartGame}
      className="w-full"
      style={{
        background: canStartGame ? 'var(--color-accent)' : 'var(--color-surface-alt)',
        color: canStartGame ? 'white' : 'var(--color-text-tertiary)',
        border: 'none',
        fontSize: '17px',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        borderRadius: 'var(--radius-button)',
        padding: '18px',
        cursor: canStartGame ? 'pointer' : 'not-allowed',
        opacity: canStartGame ? 1 : 0.6,
        boxShadow: canStartGame ? '0 4px 20px rgba(245, 158, 66, 0.35)' : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={canStartGame ? {
        opacity: 1,
        y: 0,
        boxShadow: [
          '0 4px 20px rgba(245, 158, 66, 0.35)',
          '0 4px 32px rgba(245, 158, 66, 0.55)',
          '0 4px 20px rgba(245, 158, 66, 0.35)',
        ],
      } : { opacity: 0.6, y: 0 }}
      transition={canStartGame ? {
        boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        ...MOTION.gentle,
      } : MOTION.gentle}
      whileHover={canStartGame ? { scale: 1.02 } : {}}
      whileTap={canStartGame ? { scale: 0.97 } : {}}
    >
      {settings.gameMode === 'SOLO' ? 'Start Solo Game' : 'Start Game'}
    </motion.button>
  )

  return (
    <>
      {/* Top Bar: Back + Connected */}
      <motion.div
        className="flex items-center justify-between px-4 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))', maxWidth: isDesktop ? '1200px' : undefined, margin: isDesktop ? '0 auto' : undefined, width: '100%' }}
      >
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '15px', padding: '8px 4px' }}
        >
          <span style={{ fontSize: '13px' }}>&#x2039;</span>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-caption)', color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}>
          <span style={{ fontSize: '8px' }} aria-hidden="true">&#9679;</span>
          <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>
      </motion.div>

      {/* Main content: responsive layout */}
      {isDesktop ? (
        /* Desktop: 40/60 split */
        <div style={{
          display: 'flex',
          gap: '48px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 40px',
          minHeight: 'calc(100dvh - 60px)',
        }}>
          {/* Left column: Room code + QR */}
          <div style={{ flex: '0 0 40%', paddingTop: '24px' }}>
            {roomCodeSection}
            {qrSection}
          </div>

          {/* Right column: Players + Settings + Start */}
          <div style={{
            flex: '1 1 60%',
            paddingTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingBottom: '40px',
          }}>
            {playersSection}
            <div style={{ flex: 1 }} />
            {settingsSection}
            <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
              {startButton}
            </div>
          </div>
        </div>
      ) : (
        /* Mobile: stacked layout */
        <div className="w-full max-w-lg mx-auto px-5" style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100dvh - 60px)',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        }}>
          {roomCodeSection}
          <div style={{ marginTop: '24px' }}>{qrSection}</div>
          <div style={{ marginTop: '24px' }}>{playersSection}</div>
          <div style={{ flex: 1 }} />
          <div style={{ marginTop: '24px' }}>{settingsSection}</div>

          {/* Bottom-anchored Start button */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, var(--color-bg) 70%, transparent)',
            zIndex: 'var(--z-sticky)',
          }}>
            <div className="max-w-lg mx-auto">
              {startButton}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
