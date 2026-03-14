'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false, loading: () => <div className="animate-pulse" style={{ width: 140, height: 140, borderRadius: '8px', background: 'var(--color-surface-alt)' }} /> })
import type { RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'
const ScriptCustomizationPanel = dynamic(() => import('@/components/ScriptCustomizationPanel').then(m => ({ default: m.ScriptCustomizationPanel })), { ssr: false, loading: () => null })
const CardPackSelector = dynamic(() => import('@/components/CardPackSelector').then(m => ({ default: m.CardPackSelector })), { ssr: false, loading: () => null })
const AudioSettingsPanel = dynamic(() => import('@/components/AudioSettingsPanel').then(m => ({ default: m.AudioSettingsPanel })), { ssr: false, loading: () => null })
import { SPRING, SPRING_GENTLE, SPRING_BOUNCY, STAGGER } from '@/lib/motion'
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
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Animated scan-line overlay for QR code */
function QRScanLine() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--color-stage-gold), transparent)',
        opacity: 0.55,
        animation: 'qr-scan 2.6s ease-in-out infinite',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  )
}

function formatDate(): string {
  const d = new Date()
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function HostLobby({
  settings, scriptCustomization, audioSettings, toast,
  onStartGame, onToggleMature, onUpdateGameMode,
  onSetupModeChange, onSetScriptCustomization,
  onSetAudioSettings, onSetSettings,
  onShowOnboarding, onNavigateHome,
}: HostLobbyProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const roomCode = useGameStore((s) => s.roomCode)
  const players = useGameStore((s) => s.players)
  const creditBalance = useGameStore((s) => s.creditBalance)
  const isConnected = useConnectionStore((s) => s.isConnected)
  const selectedPackId = useSelectionStore((s) => s.selectedPackId)
  const selectedPackName = useSelectionStore((s) => s.selectedPackName)
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

  // --- Clapperboard header ---
  const clapperboardHeader = (
    <div style={{
      background: 'var(--color-ink)',
      borderBottom: '3px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Diagonal B&W stripes */}
      <div style={{
        height: '8px',
        background: 'repeating-linear-gradient(-45deg, #fff 0px, #fff 8px, currentColor 8px, currentColor 16px)',
        opacity: 0.12,
        color: '#000',
      }} />

      {/* Clap fields */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '12px 20px 14px',
        maxWidth: isDesktop ? '1200px' : undefined,
        margin: isDesktop ? '0 auto' : undefined,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontFamily: 'var(--font-code)',
          fontSize: '11px',
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase' as const,
        }}>
          <span>PROD: <span style={{ color: 'rgba(255,255,255,0.7)' }}>Plot Twists</span></span>
          <span>SCENE: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedPackName || 'TBD'}</span></span>
          <span>TAKE: <span style={{ color: 'rgba(255,255,255,0.7)' }}>1</span></span>
        </div>
        <span style={{
          fontFamily: 'var(--font-code)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.04em',
          flexShrink: 0,
          marginLeft: '16px',
        }}>
          {formatDate()}
        </span>
      </div>
    </div>
  )

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
              fontFamily: 'var(--font-code)',
              fontSize: isDesktop ? '80px' : '64px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '0.04em',
              color: 'var(--color-text-primary)',
              textShadow: '0 0 60px rgba(201,162,77,0.06)',
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
            marginTop: '6px',
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-code)',
            letterSpacing: '0.02em',
            textAlign: isDesktop ? 'left' : 'center',
          }}>
            plottwists.com/join &rarr; {roomCode}
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ marginTop: '24px' }}
    >
      <div className="flex items-center gap-5" style={{
        padding: '16px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-ink)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {joinUrl ? (
          <div
            className="flex-shrink-0 rounded-lg overflow-hidden p-2"
            style={{ background: '#fff', position: 'relative' }}
          >
            <QRCodeSVG value={joinUrl} size={isDesktop ? 140 : 120} level="H" />
            <QRScanLine />
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
            Or go to <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>plottwists.com/join</span> and enter the code
          </p>
        </div>
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
          Cast ({nonHostPlayers.length})
        </p>
        <p style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-text-tertiary)',
        }}>
          Max {settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 8}
        </p>
      </div>

      {/* Player list */}
      <div className="flex flex-wrap gap-2">
        {/* Host chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_GENTLE}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: 'var(--color-ink)',
            border: '1.5px solid var(--color-stage-gold)',
            color: 'var(--color-stage-gold)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: '10px' }}>&#9733;</span>
          Host (You)
        </motion.div>

        <AnimatePresence mode="popLayout">
          {nonHostPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ ...SPRING_GENTLE, delay: index * STAGGER }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'var(--color-ink)',
                border: '1px solid rgba(255,255,255,0.10)',
                fontSize: '14px',
                fontWeight: 600,
                color: player.connected === false ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
              }}
            >
              <PlayerConnectionDot connected={player.connected} />
              {player.nickname}
              {player.level != null && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>Lv.{player.level}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Waiting chip(s) */}
        {!canStartGame && getWaitingText() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'transparent',
              border: '1.5px dashed rgba(255,255,255,0.10)',
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            waiting...
          </motion.div>
        )}
      </div>

      {/* Needed count */}
      {!canStartGame && getNeededText() && (
        <motion.p
          className="mt-3"
          style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {getNeededText()}
        </motion.p>
      )}
    </motion.div>
  ) : (
    <motion.div
      className="py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Solo mode — you are the star performer.
      </p>
    </motion.div>
  )

  const settingsSection = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
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
            style={{ overflow: 'hidden' }}
            className="mt-3"
          >
            <div className="flex flex-col gap-4">
              {/* Quick/Custom Tabs */}
              <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
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
              </div>

              {/* Game Mode Selection */}
              <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
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
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
                          <Badge variant="success" size="sm" style={{ background: 'var(--color-success)', color: 'white', borderRadius: '999px', fontSize: '9px' }}>Recommended</Badge>
                        </div>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{settings.isMature ? 'Adult themes, mature humor' : 'Fun for all ages'}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={onToggleMature}>
                        Switch
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Custom settings */}
              {gameSetupMode === 'custom' && (
                <>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{settings.isMature ? 'After Dark' : 'Family Friendly'}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Content Rating</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={onToggleMature}>
                        Switch Mode
                      </Button>
                    </div>
                  </div>
                  <CardPackSelector roomCode={roomCode} selectedPackId={selectedPackId} onSelect={(id) => useSelectionStore.getState().setSelectedPackId(id)} showCreateButton={true} />
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
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
                  </div>
                  <ScriptCustomizationPanel customization={scriptCustomization} onChange={onSetScriptCustomization} />
                  <AudioSettingsPanel settings={audioSettings} onChange={onSetAudioSettings} />
                </>
              )}

              {/* Make Public Toggle */}
              {settings.gameMode !== 'SOLO' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', background: 'var(--color-ink)', border: '1px solid var(--color-void)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
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
                  </div>
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
      animate={canStartGame ? {
        opacity: 1,
        y: 0,
        boxShadow: [
          '0 4px 20px rgba(255,255,255,0.15)',
          '0 4px 32px rgba(255,255,255,0.25)',
          '0 4px 20px rgba(255,255,255,0.15)',
        ],
      } : { opacity: 1, y: 0 }}
      transition={canStartGame ? {
        boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        ...SPRING_GENTLE,
      } : SPRING_GENTLE}
      style={{ borderRadius: '100px' }}
    >
      <button
        disabled={!canStartGame}
        onClick={() => { successHaptic(); onStartGame() }}
        style={{
          width: '100%',
          padding: '18px 40px',
          borderRadius: '100px',
          border: 'none',
          cursor: canStartGame ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          background: canStartGame ? '#fff' : 'rgba(255,255,255,0.08)',
          color: canStartGame ? 'var(--color-void)' : 'var(--color-text-tertiary)',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        Action
      </button>
    </motion.div>
  )

  return (
    <div style={{
      background: `radial-gradient(ellipse 500px 200px at 50% 0%, rgba(201,162,77,0.03), transparent), var(--color-void)`,
      minHeight: '100dvh',
    }}>
      {/* QR scan-line keyframes */}
      <style>{`
        @keyframes qr-scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>

      {/* Clapperboard header */}
      {clapperboardHeader}

      {/* Top Bar: Back + Connected */}
      <motion.div
        className="flex items-center justify-between px-4 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ paddingTop: '16px', maxWidth: isDesktop ? '1200px' : undefined, margin: isDesktop ? '0 auto' : undefined, width: '100%' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateHome}
          icon={<span style={{ fontSize: '13px' }}>&#x2039;</span>}
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Back
        </Button>
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
          minHeight: 'calc(100dvh - 140px)',
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
          minHeight: 'calc(100dvh - 140px)',
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
            background: 'linear-gradient(to top, var(--color-void) 70%, transparent)',
            zIndex: 'var(--z-sticky)',
          }}>
            <div className="max-w-lg mx-auto">
              {startButton}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
