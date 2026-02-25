'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { CardPackMetadata } from '@/lib/types'
import dynamic from 'next/dynamic'
const CardPackCreator = dynamic(() => import('./CardPackCreator').then(m => ({ default: m.CardPackCreator })), { ssr: false })
import { CardPackEditor } from './CardPackEditor'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { StarRating } from './StarRating'
import { CardPackBrowser } from './CardPackBrowser'

interface CardPackSelectorProps {
  roomCode?: string
  selectedPackId?: string
  onSelect?: (packId: string) => void
  disabled?: boolean
  showCreateButton?: boolean
}

const STANDARD_PACK_ID = 'standard'

const THEME_BORDER_CLASS: Record<string, string> = {
  mixed: 'pack-card-border-mixed',
  horror: 'pack-card-border-horror',
  'sci-fi': 'pack-card-border-scifi',
  scifi: 'pack-card-border-scifi',
  fantasy: 'pack-card-border-fantasy',
  romance: 'pack-card-border-romance',
  mystery: 'pack-card-border-mystery',
}

function getThemeBorderClass(theme: string): string {
  return THEME_BORDER_CLASS[theme.toLowerCase()] || 'pack-card-border-default'
}

export function CardPackSelector({
  roomCode,
  selectedPackId = STANDARD_PACK_ID,
  onSelect,
  disabled = false,
  showCreateButton = false
}: CardPackSelectorProps) {
  const { socket } = useSocket()
  const [packs, setPacks] = useState<CardPackMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [editingPackId, setEditingPackId] = useState<string | null>(null)
  const [deletingPack, setDeletingPack] = useState<CardPackMetadata | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)

  // Fetch available packs
  const fetchPacks = useCallback(() => {
    if (!socket) return

    setLoading(true)
    socket.emit('list_card_packs', (response) => {
      setLoading(false)
      if (response.success && response.packs) {
        setPacks(response.packs)
      } else {
        setError(response.error || 'Failed to load card packs')
      }
    })
  }, [socket])

  useEffect(() => {
    fetchPacks()
  }, [fetchPacks])

  // Listen for pack selection updates
  useEffect(() => {
    if (!socket) return

    const handlePackSelected = (packId: string) => {
      onSelect?.(packId)
    }

    socket.on('card_pack_selected', handlePackSelected)
    return () => {
      socket.off('card_pack_selected', handlePackSelected)
    }
  }, [socket, onSelect])

  const selectPack = (packId: string) => {
    if (!socket || disabled) return

    if (roomCode) {
      socket.emit('select_card_pack', roomCode, packId, (response) => {
        if (!response.success) {
          setError(response.error || 'Failed to select pack')
        }
      })
    } else {
      onSelect?.(packId)
    }
  }

  const selectedPack = packs.find(p => p.id === selectedPackId) || {
    id: STANDARD_PACK_ID,
    name: 'Standard Pack',
    description: 'The original Plot Twists collection',
    author: 'Plot Twists',
    theme: 'mixed',
    isMature: false,
    isBuiltIn: true,
    cardCounts: { characters: 200, settings: 70, circumstances: 60 },
    downloads: 0,
    rating: 5.0
  }

  const handlePackCreated = (packId: string) => {
    fetchPacks() // Refresh the pack list
    selectPack(packId) // Auto-select the new pack
  }

  const handlePackUpdated = () => {
    fetchPacks() // Refresh the pack list
    setEditingPackId(null)
  }

  const handleDeletePack = () => {
    if (!socket || !deletingPack) return

    setIsDeleting(true)
    socket.emit('delete_card_pack', deletingPack.id, (response) => {
      setIsDeleting(false)
      if (response.success) {
        // If deleting the selected pack, switch to standard
        if (selectedPackId === deletingPack.id) {
          selectPack(STANDARD_PACK_ID)
        }
        fetchPacks()
        setDeletingPack(null)
      } else {
        setError(response.error || 'Failed to delete pack')
        setDeletingPack(null)
      }
    })
  }

  const handleRatePack = (packId: string, rating: number) => {
    if (!socket || disabled) return

    socket.emit('rate_card_pack', packId, rating, (response) => {
      if (response.success) {
        // Update the local pack rating
        setPacks(packs.map(p =>
          p.id === packId ? { ...p, rating: response.newRating || rating } : p
        ))
      } else {
        setError(response.error || 'Failed to rate pack')
      }
    })
  }

  return (
    <>
    <CardPackCreator
      isOpen={showCreator}
      onClose={() => setShowCreator(false)}
      onCreated={handlePackCreated}
    />
    {editingPackId && (
      <CardPackEditor
        isOpen={true}
        packId={editingPackId}
        onClose={() => setEditingPackId(null)}
        onUpdated={handlePackUpdated}
      />
    )}
    <DeleteConfirmModal
      isOpen={!!deletingPack}
      title="Delete Card Pack"
      message="Are you sure you want to delete this card pack?"
      itemName={deletingPack?.name}
      onConfirm={handleDeletePack}
      onCancel={() => setDeletingPack(null)}
      isDeleting={isDeleting}
    />
    <CardPackBrowser
      isOpen={showBrowser}
      onClose={() => setShowBrowser(false)}
      onSelectPack={(packId) => {
        selectPack(packId)
        fetchPacks() // Refresh in case a new pack was added
      }}
      currentPackId={selectedPackId}
    />
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between text-left transition-colors disabled:opacity-50"
        style={{ minHeight: '44px' }}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--color-surface-alt)')}
        onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'transparent')}
        aria-expanded={isExpanded}
        aria-controls="pack-selector-content"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">📦</span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Card Pack</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedPack.name}
              {selectedPack.isBuiltIn && ' (Default)'}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-hidden="true"
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="pack-selector-content"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {loading ? (
                <div className="text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                  Loading packs...
                </div>
              ) : error ? (
                <div className="text-center py-4" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </div>
              ) : (
                <>
                  {packs.map(pack => {
                    const isSelected = selectedPackId === pack.id
                    return (
                    <motion.div
                      key={pack.id}
                      whileHover={{ scale: disabled ? 1 : 1.02 }}
                      className={`pack-card w-full p-4 rounded-xl text-left transition-all ${getThemeBorderClass(pack.theme)} ${isSelected ? 'polaroid-card' : ''}`}
                      style={{
                        background: isSelected ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                        border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        opacity: disabled ? 0.5 : 1,
                        boxShadow: isSelected ? '0 8px 24px rgba(42, 39, 34, 0.15)' : undefined,
                      }}
                    >
                      {isSelected && <div className="tape-piece tape-top-center" style={{ width: '40px', height: '14px', top: '-7px' }} />}
                      <button
                        onClick={() => selectPack(pack.id)}
                        disabled={disabled}
                        className="w-full text-left"
                        style={{ minHeight: '44px' }}
                        aria-pressed={isSelected}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                              {pack.name}
                              {pack.isBuiltIn && (
                                <span className="annotation" style={{ fontSize: 11, transform: 'rotate(-1deg)' }}>
                                  Default
                                </span>
                              )}
                              {pack.isMature && (
                                <span className="annotation" style={{ fontSize: 11, transform: 'rotate(1deg)', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                                  18+
                                </span>
                              )}
                            </h4>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{pack.description}</p>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <StarRating
                              rating={pack.rating}
                              size="sm"
                              interactive={!pack.isBuiltIn}
                              disabled={disabled}
                              onRate={(rating) => handleRatePack(pack.id, rating)}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span style={{ color: 'var(--color-text-tertiary)' }}>By {pack.author}</span>
                          <div className="flex gap-1.5">
                            <span className="pack-count-pill pack-count-characters">🎭 {pack.cardCounts.characters}</span>
                            <span className="pack-count-pill pack-count-settings">🏠 {pack.cardCounts.settings}</span>
                            <span className="pack-count-pill pack-count-circumstances">⚡ {pack.cardCounts.circumstances}</span>
                          </div>
                        </div>
                      </button>

                      {/* Edit/Delete buttons for non-built-in packs */}
                      {!pack.isBuiltIn && !disabled && (
                        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPackId(pack.id)
                            }}
                            className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                            style={{
                              background: 'var(--color-surface-alt)',
                              color: 'var(--color-text-secondary)',
                              minHeight: '44px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-surface-elevated)'
                              e.currentTarget.style.color = 'var(--color-text-primary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--color-surface-alt)'
                              e.currentTarget.style.color = 'var(--color-text-secondary)'
                            }}
                          >
                            <span aria-hidden="true">✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingPack(pack)
                            }}
                            className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                            style={{
                              background: 'var(--color-danger-light)',
                              color: 'var(--color-danger)',
                              minHeight: '44px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <span aria-hidden="true">🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )})}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowBrowser(true)}
                      className="flex-1 p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-accent-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-accent)'}
                    >
                      <span aria-hidden="true">🌐</span>
                      <span>Browse Community Packs</span>
                    </button>
                  </div>

                  {showCreateButton && (
                    <button
                      onClick={() => setShowCreator(true)}
                      className="w-full p-4 rounded-xl border-2 border-dashed transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-tertiary)',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                        e.currentTarget.style.color = 'var(--color-accent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.color = 'var(--color-text-tertiary)'
                      }}
                    >
                      + Create Custom Pack
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
