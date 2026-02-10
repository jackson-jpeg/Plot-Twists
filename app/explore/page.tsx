'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import type { CardPackMetadata, CardPack } from '@/lib/types'

type Tab = 'featured' | 'search'

const packRotations = [-1.5, 1, -0.5, 1.5, -1, 0.5]

function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const rotation = packRotations[index % packRotations.length]

  return (
    <motion.button
      onClick={() => onSelect(pack)}
      initial={{ opacity: 0, y: 20, rotate: rotation + 3 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, rotate: 0, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="polaroid-card relative w-full text-left cursor-pointer transition-shadow hover:shadow-xl"
    >
      <div className="tape-piece tape-top-center" style={{ width: '44px', height: '16px', top: '-8px' }} />
      <div className="p-4 pt-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-display">{pack.name}</h3>
          {pack.isMature && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)] text-white font-bold shrink-0 ml-2">
              18+
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-3 leading-relaxed line-clamp-2">
          {pack.description}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
          <span className="font-handwritten">by {pack.author}</span>
          <span>{pack.cardCounts.characters + pack.cardCounts.settings + pack.cardCounts.circumstances} cards</span>
          <span>{pack.downloads} downloads</span>
          {pack.rating > 0 && <span>{'★'.repeat(Math.round(pack.rating))} {pack.rating.toFixed(1)}</span>}
        </div>
      </div>
    </motion.button>
  )
}

function PackPreviewContent({
  pack,
  onClose,
}: {
  pack: CardPack
  onClose: () => void
}) {
  const router = useRouter()

  const handleUseInGame = () => {
    try {
      localStorage.setItem('plottwists_selected_pack', pack.id)
    } catch { /* ignore */ }
    onClose()
    router.push('/host')
  }

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display mb-1">
          {pack.name}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] font-handwritten">by {pack.author}</p>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {pack.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
          {pack.theme}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
          {pack.downloads} downloads
        </span>
        {pack.rating > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
            ★ {pack.rating.toFixed(1)} ({pack.ratingCount} ratings)
          </span>
        )}
      </div>

      {/* Card counts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Characters', count: pack.characters.length, icon: '🎭' },
          { label: 'Settings', count: pack.settings.length, icon: '🏠' },
          { label: 'Circumstances', count: pack.circumstances.length, icon: '🌀' },
        ].map((cat) => (
          <div key={cat.label} className="polaroid-card text-center p-3">
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-lg font-bold text-[var(--color-text-primary)] font-display">{cat.count}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Sample cards */}
      {pack.characters.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            Sample Characters
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {pack.characters.slice(0, 6).map((card) => (
              <span key={card.id} className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                {card.name}
              </span>
            ))}
            {pack.characters.length > 6 && (
              <span className="text-xs px-2.5 py-1 text-[var(--color-text-muted)]">
                +{pack.characters.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleUseInGame}
        className="btn btn-primary w-full py-3 font-semibold text-[15px]"
      >
        Use in Next Game
      </button>
    </div>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const [activeTab, setActiveTab] = useState<Tab>('featured')
  const [featuredPacks, setFeaturedPacks] = useState<CardPackMetadata[]>([])
  const [searchResults, setSearchResults] = useState<CardPackMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPackFull, setSelectedPackFull] = useState<CardPack | null>(null)
  const [loadingPack, setLoadingPack] = useState(false)

  const loadFeatured = useCallback(() => {
    if (!socket || !isConnected) return
    setLoading(true)
    socket.emit('get_featured_packs', 20, (response) => {
      setLoading(false)
      if (response.success && response.packs) {
        setFeaturedPacks(response.packs)
      }
    })
  }, [socket, isConnected])

  useEffect(() => {
    loadFeatured()
  }, [loadFeatured])

  const handleSearch = useCallback(() => {
    if (!socket || !isConnected || !searchQuery.trim()) return
    setLoading(true)
    socket.emit('search_card_packs', searchQuery.trim(), (response) => {
      setLoading(false)
      if (response.success && response.packs) {
        setSearchResults(response.packs)
        setActiveTab('search')
      }
    })
  }, [socket, isConnected, searchQuery])

  const handleSelectPack = (pack: CardPackMetadata) => {
    if (!socket) return
    setLoadingPack(true)
    socket.emit('get_card_pack', pack.id, (response) => {
      setLoadingPack(false)
      if (response.success && response.pack) {
        setSelectedPackFull(response.pack)
      }
    })
  }

  const currentPacks = activeTab === 'featured' ? featuredPacks : searchResults
  const tabs = [
    { id: 'featured' as Tab, label: 'Featured Packs', icon: '⭐' },
    ...(searchResults.length > 0 ? [{ id: 'search' as Tab, label: `Results (${searchResults.length})`, icon: '🔍' }] : []),
  ]
  const tabRotations = [-1, 0.5]

  return (
    <main className="page-container home-nostalgic" style={{ minHeight: '100dvh' }}>
      {/* Back button — ticket stub style */}
      <motion.button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg shadow-lg hover:shadow-xl transition-all"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transform: 'rotate(-1deg)' }}
      >
        <span className="text-xl">←</span>
        <span className="font-medium text-[var(--color-text-primary)]">Home</span>
      </motion.button>

      <div className="container max-w-2xl pt-20 pb-8 px-4">
        {/* Bulletin board header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bulletin-board-header mb-6"
        >
          <div className="header-polaroid" style={{ transform: 'rotate(-1deg)' }}>
            <h1 className="hero-title-nostalgic text-3xl md:text-4xl">
              Explore Packs
              <span className="title-emoji text-4xl ml-2">🎴</span>
            </h1>
            <div className="polaroid-caption">
              Discover card packs to spice up your next game
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-5"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search packs..."
            className="input flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="btn btn-primary px-5 shrink-0"
          >
            Search
          </button>
        </motion.div>

        {/* Paper tabs */}
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative mb-5">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px ${
                  isActive
                    ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] z-10'
                    : 'bg-[var(--color-surface-alt)] border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                style={{
                  transform: isActive ? 'rotate(0deg) translateY(-2px)' : `rotate(${tabRotations[index]}deg)`,
                  boxShadow: isActive ? 'var(--shadow-2)' : 'none'
                }}
                whileHover={!isActive ? { y: -2, rotate: 0 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon} {tab.label}
              </motion.button>
            )
          })}
        </div>

        {/* Pack grid */}
        {loading ? (
          <div className="py-12">
            <LoadingSpinner variant="theater" text="Searching the archives..." />
          </div>
        ) : currentPacks.length === 0 ? (
          activeTab === 'search' ? (
            <EmptyState
              variant="search"
              title="No packs found"
              description="Try a different search term or browse the featured packs."
              action={{ label: 'View Featured', onClick: () => setActiveTab('featured') }}
            />
          ) : (
            <EmptyState
              variant="default"
              title="No featured packs yet"
              description="Check back soon for curated card packs!"
            />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentPacks.map((pack, index) => (
              <PackCard key={pack.id} pack={pack} onSelect={handleSelectPack} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Loading overlay when fetching pack details */}
      <AnimatePresence>
        {loadingPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <LoadingSpinner variant="theater" text="Loading pack details..." />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pack Preview Modal — reusing shared Modal component */}
      <Modal
        isOpen={!!selectedPackFull}
        onClose={() => setSelectedPackFull(null)}
        maxWidth="500px"
      >
        {selectedPackFull && (
          <PackPreviewContent
            pack={selectedPackFull}
            onClose={() => setSelectedPackFull(null)}
          />
        )}
      </Modal>
    </main>
  )
}
