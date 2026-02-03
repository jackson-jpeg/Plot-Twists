'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { CardPackMetadata } from '@/lib/types'
import { StarRating } from './StarRating'
import { CardSkeleton } from './EmptyState'

interface CardPackBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelectPack: (packId: string) => void
  currentPackId?: string
}

type SortOption = 'rating' | 'downloads' | 'newest' | 'name'

const THEMES = [
  { value: 'all', label: 'All', emoji: '🎭' },
  { value: 'office', label: 'Office', emoji: '💼' },
  { value: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
  { value: 'fantasy', label: 'Fantasy', emoji: '🧙' },
  { value: 'horror', label: 'Horror', emoji: '👻' },
  { value: 'romance', label: 'Romance', emoji: '💕' },
  { value: 'action', label: 'Action', emoji: '💥' },
  { value: 'comedy', label: 'Comedy', emoji: '😂' },
  { value: 'mixed', label: 'Mixed', emoji: '🎲' }
]

export function CardPackBrowser({ isOpen, onClose, onSelectPack, currentPackId }: CardPackBrowserProps) {
  const { socket } = useSocket()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [packs, setPacks] = useState<CardPackMetadata[]>([])
  const [featuredPacks, setFeaturedPacks] = useState<CardPackMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all packs
  const fetchPacks = useCallback(() => {
    if (!socket) return

    setLoading(true)
    socket.emit('list_card_packs', (response) => {
      setLoading(false)
      if (response.success && response.packs) {
        setPacks(response.packs)
      } else {
        setError(response.error || 'Failed to load packs')
      }
    })
  }, [socket])

  // Fetch featured packs
  const fetchFeatured = useCallback(() => {
    if (!socket) return

    socket.emit('get_featured_packs', 5, (response) => {
      if (response.success && response.packs) {
        setFeaturedPacks(response.packs)
      }
    })
  }, [socket])

  // Search packs
  const searchPacks = useCallback(() => {
    if (!socket || !searchQuery.trim()) {
      fetchPacks()
      return
    }

    setLoading(true)
    socket.emit('search_card_packs', searchQuery, (response) => {
      setLoading(false)
      if (response.success && response.packs) {
        setPacks(response.packs)
      } else {
        setError(response.error || 'Failed to search packs')
      }
    })
  }, [socket, searchQuery, fetchPacks])

  useEffect(() => {
    if (isOpen) {
      fetchPacks()
      fetchFeatured()
    }
  }, [isOpen, fetchPacks, fetchFeatured])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPacks()
      } else {
        fetchPacks()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchPacks, fetchPacks])

  // Filter and sort packs
  const filteredPacks = packs
    .filter(pack => !pack.isBuiltIn) // Exclude built-in packs
    .filter(pack => selectedTheme === 'all' || pack.theme === selectedTheme)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'newest':
          return 0 // Would need createdAt, default order is fine
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const handleSelect = (packId: string) => {
    onSelectPack(packId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Browse Card Packs</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                x
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, author, or theme..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Theme filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {THEMES.map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => setSelectedTheme(theme.value)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      selectedTheme === theme.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    aria-label={`Filter by ${theme.label} theme`}
                    aria-pressed={selectedTheme === theme.value}
                  >
                    {theme.emoji} {theme.label}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 bg-gray-800 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="downloads">Sort by Downloads</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton count={6} className="grid-cols-1" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                {error}
              </div>
            ) : (
              <>
                {/* Featured Section */}
                {!searchQuery && featuredPacks.length > 0 && selectedTheme === 'all' && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>⭐</span> Featured Packs
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {featuredPacks.slice(0, 4).map(pack => (
                        <motion.button
                          key={pack.id}
                          onClick={() => handleSelect(pack.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl text-left transition-all ${
                            currentPackId === pack.id
                              ? 'bg-purple-600 ring-2 ring-purple-400'
                              : 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 hover:from-purple-800/50 hover:to-blue-800/50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-white">{pack.name}</h4>
                            <StarRating rating={pack.rating} size="sm" />
                          </div>
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">{pack.description}</p>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>By {pack.author}</span>
                            <span>{pack.downloads} downloads</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Packs */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {searchQuery ? `Search Results (${filteredPacks.length})` : `All Packs (${filteredPacks.length})`}
                  </h3>

                  {filteredPacks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-4">📦</div>
                      <p>No packs found</p>
                      {searchQuery && (
                        <p className="text-sm mt-2">Try a different search term</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredPacks.map(pack => (
                        <motion.button
                          key={pack.id}
                          onClick={() => handleSelect(pack.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl text-left transition-all ${
                            currentPackId === pack.id
                              ? 'bg-purple-600 ring-2 ring-purple-400'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-white flex items-center gap-2">
                                {pack.name}
                                {pack.isMature && (
                                  <span className="text-xs bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded">
                                    18+
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>

                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{pack.description}</p>

                          <div className="flex items-center justify-between">
                            <StarRating rating={pack.rating} size="sm" />
                            <span className="text-xs text-gray-500">
                              {pack.cardCounts.characters}C / {pack.cardCounts.settings}S / {pack.cardCounts.circumstances}X
                            </span>
                          </div>

                          <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                            <span>By {pack.author}</span>
                            <span>{pack.downloads} downloads</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
