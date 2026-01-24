'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { CardPackMetadata } from '@/lib/types'

interface CardPackSelectorProps {
  roomCode?: string
  selectedPackId?: string
  onSelect?: (packId: string) => void
  disabled?: boolean
  showCreateButton?: boolean
}

const STANDARD_PACK_ID = 'standard'

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

  return (
    <div className="bg-gray-900/50 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <h3 className="font-semibold text-white">Card Pack</h3>
            <p className="text-sm text-gray-400">
              {selectedPack.name}
              {selectedPack.isBuiltIn && ' (Default)'}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {loading ? (
                <div className="text-center py-4 text-gray-400">
                  Loading packs...
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-400">
                  {error}
                </div>
              ) : (
                <>
                  {packs.map(pack => (
                    <motion.button
                      key={pack.id}
                      onClick={() => selectPack(pack.id)}
                      disabled={disabled}
                      whileHover={{ scale: disabled ? 1 : 1.02 }}
                      whileTap={{ scale: disabled ? 1 : 0.98 }}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedPackId === pack.id
                          ? 'bg-purple-600 ring-2 ring-purple-400'
                          : 'bg-gray-800 hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            {pack.name}
                            {pack.isBuiltIn && (
                              <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                            {pack.isMature && (
                              <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">
                                18+
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400">{pack.description}</p>
                        </div>
                        {pack.rating > 0 && (
                          <div className="text-yellow-400 text-sm">
                            {'★'.repeat(Math.round(pack.rating))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>By {pack.author}</span>
                        <span>
                          {pack.cardCounts.characters}C / {pack.cardCounts.settings}S / {pack.cardCounts.circumstances}X
                        </span>
                      </div>
                    </motion.button>
                  ))}

                  {showCreateButton && (
                    <button
                      onClick={() => {/* TODO: Open pack creator modal */}}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
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
  )
}
