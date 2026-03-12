'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false, loading: () => <div className="animate-pulse rounded-lg" style={{ width: 140, height: 140, background: 'var(--color-surface-alt)' }} /> })
import type { RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'
const ScriptCustomizationPanel = dynamic(() => import('@/components/ScriptCustomizationPanel').then(m => ({ default: m.ScriptCustomizationPanel })), { ssr: false, loading: () => null })
const CardPackSelector = dynamic(() => import('@/components/CardPackSelector').then(m => ({ default: m.CardPackSelector })), { ssr: false, loading: () => null })
const AudioSettingsPanel = dynamic(() => import('@/components/AudioSettingsPanel').then(m => ({ default: m.AudioSettingsPanel })), { ssr: false, loading: () => null })
import { SPRING, SPRING_GENTLE, ENTER_Y, PRESS, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'
import { Button, Card, Badge, Avatar } from '@/components/ui'
import { PlayerConnectionDot } from '@/components/PlayerConnectionDot'
import { useGameStore } from '@/stores/gameStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { socketManager } from '@/lib/socketManager'

export interface HostLobbyProps {
  settings: RoomSettings
  scriptCustomization: ScriptCustomization
  audioSettings: AudioSettings
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  onStartGame: () => void
  onToggleMature: () => void
  onUpdateGameMode: (mode: GameMode) => void
  onSetupModeChange: (mode: 'quick' | 'custom') => void
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
      className="transition-transform duration-200"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HostLobby({
  settings, scriptCustomization, audioSettings, toast,
  onStartGame, onToggleMature, onUpdateGameMode,
  onSetupModeChange, onSetScriptCustomization,
  onSetAudioSettings, onSetSettings,
  onShowOnboarding, onNavigateHome,
}: HostLobbyProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const roomCode = useGameStore((s) => s.roomCode)
  const players = useGameStore((s) => s.players)
  const creditBalance = useGameStore((s) => s.creditBalance)
  const isConnected = useConnectionStore((s) => s.isConnected)
  const selectedPackId = useSelectionStore((s) => s.selectedPackId)
  const gameSetupMode = useSelectionStore((s) => s.gameSetupMode)

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/invite/${roomCode}` : ''
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

  // --- Sections ---

  const roomCodeSection = (
    <motion.div
      {...ENTER_Y}
      transition={{ ...SPRING_GENTLE, delay: 0.1 }}
      className="text-center rounded-[28px] border px-5 py-6"
      style={{
        background: 'var(--gradient-stage)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: 'var(--shadow-marquee)',
      }}
    >
      <p
        className="uppercase tracking-widest font-semibold mb-2"
        style={{ fontSize: '11px', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.62)' }}
      >
        Tonight&apos;s room code
      </p>
      {roomCode ? (
        <>
          <div className="flex items-center justify-center gap-3">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '64px',
                lineHeight: 1,
                letterSpacing: '0.04em',
                color: 'white',
                textShadow: '0 10px 30px rgba(0,0,0,0.28)',
              }}
            >
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
              className="p-2 cursor-pointer bg-transparent border-none mt-2"
              style={{ color: 'rgba(255,255,255,0.68)' }}
              whileHover={{ scale: 1.1 }}
              {...PRESS}
              title="Copy join link"
              aria-label="Copy join link"
            >
              <CopyIcon size={22} />
            </motion.button>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Cast your players and get the audience in the room
          </p>
          {creditBalance && (
            <p
              className="mt-1.5 text-xs"
              style={{ color: creditBalance.total === 0 ? '#ffd4d4' : 'rgba(255,255,255,0.58)' }}
            >
              {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''} remaining
            </p>
          )}
        </>
      ) : (
        <div className="animate-pulse inline-block rounded-xl" style={{ width: '280px', height: '72px', background: 'var(--color-surface-alt)' }} />
      )}
    </motion.div>
  )

  const qrSection = (
    <motion.div
      {...ENTER_Y}
      transition={{ ...SPRING_GENTLE, delay: 0.2 }}
      className="mt-6"
    >
      <button
        onClick={() => setQrOpen(prev => !prev)}
        className="flex items-center justify-center gap-2 w-full py-2 cursor-pointer bg-transparent border-none"
        style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontFamily: 'var(--font-body)' }}
      >
        <span>{qrOpen ? 'Hide' : 'Show'} QR Code</span>
        <ChevronIcon size={14} direction={qrOpen ? 'up' : 'down'} />
      </button>
      <AnimatePresence>
        {qrOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_GENTLE}
            className="overflow-hidden"
          >
            <Card variant="surface" padding="md" className="flex items-center gap-5 mt-2">
              {joinUrl ? (
                <div className="flex-shrink-0 rounded-lg overflow-hidden p-2" style={{ background: 'var(--color-surface-alt)' }}>
                  <QRCodeSVG value={joinUrl} size={isDesktop ? 140 : 120} level="H" />
                </div>
              ) : (
                <div className="animate-pulse flex-shrink-0 rounded-lg" style={{ width: '136px', height: '136px', background: 'var(--color-surface-alt)' }} />
              )}
              <div>
                <p className="font-bold text-[17px]" style={{ color: 'var(--color-text-primary)' }}>
                  Scan to join
                </p>
                <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Or go to <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>plot-twists.com</span> and enter the code above
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const playersSection = settings.gameMode !== 'SOLO' ? (
    <motion.div
      {...ENTER_Y}
      transition={{ ...SPRING_GENTLE, delay: 0.3 }}
    >
      {/* Players header */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="uppercase tracking-widest font-semibold"
          style={{ fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--color-text-tertiary)' }}
        >
          Players ({nonHostPlayers.length})
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
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
              transition={{ ...SPRING_GENTLE, delay: index * STAGGER }}
            >
              <Card variant="surface" padding="sm" className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...SPRING, delay: index * STAGGER + 0.1 }}
                >
                  <Avatar name={player.nickname} size="md" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <PlayerConnectionDot connected={player.connected} />
                    <p
                      className="font-semibold text-sm truncate"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: player.connected === false ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                      }}
                    >
                      {player.nickname}
                    </p>
                  </div>
                </div>

                {player.level != null ? (
                  <Badge variant="default" size="sm">Lv.{player.level}</Badge>
                ) : (
                  <Badge variant={player.hasSubmittedSelection ? 'success' : 'default'} size="sm">
                    {player.hasSubmittedSelection ? 'Ready' : 'Joined'}
                  </Badge>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {!canStartGame && getWaitingText() && (
          <motion.p
            className="text-center py-5 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
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
      transition={{ ...SPRING_GENTLE, delay: 0.3 }}
    >
      <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
        Solo mode — you are the star performer. Press Start Game when ready.
      </p>
    </motion.div>
  )

  const settingsSection = (
    <motion.div
      {...ENTER_Y}
      transition={{ ...SPRING_GENTLE, delay: 0.4 }}
    >
      <Button
        variant="secondary"
        size="md"
        fullWidth
        onClick={() => setSettingsOpen(prev => !prev)}
        iconRight={<ChevronIcon size={16} direction={settingsOpen ? 'up' : 'down'} />}
      >
        Game Settings
      </Button>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_GENTLE}
            className="overflow-hidden mt-3"
          >
            <div className="flex flex-col gap-4">
              {/* Quick/Custom Tabs */}
              <Card variant="surface" padding="md">
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={gameSetupMode === 'quick' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                    onClick={() => onSetupModeChange('quick')}
                    style={gameSetupMode === 'quick' ? { background: 'var(--color-success)', border: '2px solid var(--color-success)' } : {}}
                  >
                    Quick Game
                  </Button>
                  <Button
                    variant={gameSetupMode === 'custom' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                    onClick={() => onSetupModeChange('custom')}
                  >
                    Custom Game
                  </Button>
                </div>
                <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {gameSetupMode === 'quick' ? 'Recommended settings for fast setup' : 'Customize all game options'}
                </p>
              </Card>

              {/* Game Mode Selection */}
              <Card variant="surface" padding="md">
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
                >
                  Game Mode
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {([
                    { mode: 'SOLO' as const, label: 'Solo', desc: '1 player vs AI', sublabel: '' },
                    { mode: 'HEAD_TO_HEAD' as const, label: 'Head-to-Head', desc: '2 performers + host', sublabel: 'Host runs the teleprompter' },
                    { mode: 'ENSEMBLE' as const, label: 'Ensemble', desc: '3-6 performers + host', sublabel: 'Host runs the teleprompter' },
                  ]).map(({ mode, label, desc, sublabel }) => (
                    <motion.button
                      key={mode}
                      onClick={() => onUpdateGameMode(mode)}
                      className="p-4 cursor-pointer relative overflow-visible text-left"
                      style={{
                        borderRadius: 'var(--radius-card)',
                        border: settings.gameMode === mode ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        background: settings.gameMode === mode ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      {...PRESS}
                    >
                      {gameSetupMode === 'quick' && mode === 'ENSEMBLE' && (
                        <div className="absolute -top-2 -right-2">
                          <Badge variant="success" size="sm" style={{ background: 'var(--color-success)', color: 'white', borderRadius: '999px', fontSize: '9px' }}>Recommended</Badge>
                        </div>
                      )}
                      <div className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{label}</div>
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
              </Card>

              {/* Content Rating */}
              {gameSetupMode === 'quick' && (
                <motion.div {...ENTER_Y} transition={{ ...SPRING_GENTLE, delay: 0.1 }}>
                  <Card variant="surface" padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[17px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{settings.isMature ? 'Adult themes, mature humor' : 'Fun for all ages'}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={onToggleMature}>
                        Switch
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Custom settings */}
              {gameSetupMode === 'custom' && (
                <>
                  <Card variant="surface" padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[17px] font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Content Rating</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={onToggleMature}>
                        Switch Mode
                      </Button>
                    </div>
                  </Card>
                  <CardPackSelector roomCode={roomCode} selectedPackId={selectedPackId} onSelect={(id) => useSelectionStore.getState().setSelectedPackId(id)} showCreateButton={true} />
                  <Card variant="surface" padding="sm">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Quick Themes</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { label: 'Horror Comedy', style: 'dark' as const, mature: false },
                        { label: 'Kids Party', style: 'slapstick' as const, mature: false },
                        { label: 'Office Shenanigans', style: 'sitcom' as const, mature: false },
                        { label: 'After Hours', style: 'dark' as const, mature: true },
                      ].map((theme) => (
                        <Button
                          key={theme.label}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onSetScriptCustomization(prev => ({ ...prev, comedyStyle: theme.style }))
                            if (theme.mature !== settings.isMature) {
                              const newSettings = { ...settings, isMature: theme.mature }
                              onSetSettings(newSettings)
                              socketManager.emit('update_room_settings', roomCode, { isMature: theme.mature })
                            }
                            toast.success(`${theme.label} theme activated!`)
                          }}
                          style={{ border: '1px solid var(--color-border)', minHeight: '44px' }}
                        >
                          {theme.label}
                        </Button>
                      ))}
                    </div>
                  </Card>
                  <ScriptCustomizationPanel customization={scriptCustomization} onChange={onSetScriptCustomization} />
                  <AudioSettingsPanel settings={audioSettings} onChange={onSetAudioSettings} />
                </>
              )}

              {/* Make Public Toggle */}
              {settings.gameMode !== 'SOLO' && (
                <motion.div
                  {...ENTER_Y}
                  transition={{ ...SPRING_GENTLE, delay: 0.15 }}
                >
                  <Card variant="surface" padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[17px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                          {settings.isPublic ? 'Public Game' : 'Private Game'}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {settings.isPublic ? 'Anyone can join from Quick Play' : 'Invite only via room code'}
                        </p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => {
                        const newPublic = !settings.isPublic
                        onSetSettings(prev => ({ ...prev, isPublic: newPublic }))
                        socketManager.emit('update_room_settings', roomCode, { isPublic: newPublic })
                        tapHaptic()
                      }}>
                        {settings.isPublic ? 'Make Private' : 'Make Public'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const startButton = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_GENTLE}
      style={{
        borderRadius: 'var(--radius-button)',
        ...(canStartGame && { boxShadow: '0 0 20px rgba(245, 158, 66, 0.4)' }),
      }}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canStartGame}
        onClick={() => { successHaptic(); onStartGame() }}
        className="py-[18px]"
        style={{
          ...(canStartGame && { boxShadow: '0 0 20px rgba(245, 158, 66, 0.4)' }),
        }}
      >
        {settings.gameMode === 'SOLO' ? 'Start Solo Game' : 'Start Game'}
      </Button>
    </motion.div>
  )

  return (
    <>
      {/* Top Bar: ← Back + ● Connected */}
      <motion.div
        className="flex items-center justify-between px-4 pb-2 w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
          maxWidth: isDesktop ? '1200px' : undefined,
          margin: isDesktop ? '0 auto' : undefined,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          icon={<span className="text-[13px]">&#x2039;</span>}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Back
        </Button>
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          <span className="text-[8px]" aria-hidden="true">&#9679;</span>
          <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>
      </motion.div>

      {/* Main content */}
      <div
        className="w-full max-w-lg mx-auto px-5 flex flex-col"
        style={{
          minHeight: 'calc(100dvh - 60px)',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="rounded-[32px] border p-3" style={{ background: 'rgba(255,255,255,0.34)', borderColor: 'rgba(255,255,255,0.5)' }}>
          {roomCodeSection}
        </div>
        {qrSection}
        <div className="mt-6">{playersSection}</div>
        <div className="flex-1" />
        <div className="mt-6">{settingsSection}</div>

        {/* Fixed bottom Start button */}
        <div
          className="fixed bottom-0 left-0 right-0 px-5 z-50"
          style={{
            paddingTop: '16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, rgba(244,236,222,0.96) 68%, transparent)',
          }}
        >
          <div className="max-w-lg mx-auto">
            {startButton}
          </div>
        </div>
      </div>
    </>
  )
}
