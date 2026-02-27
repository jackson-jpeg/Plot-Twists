'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState, CardSkeleton } from '@/components/EmptyState'
import type { CardPackMetadata, CardPack } from '@/lib/types'

type Tab = 'featured' | 'search'

const packRotations = [-1.5, 1, -0.5, 1.5, -1, 0.5]

function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const rotation = packRotations[index % packRotations.length]
  const totalCards = pack.cardCounts.characters + pack.cardCounts.settings + pack.cardCounts.circumstances

  return (
    <motion.button
      onClick={() => onSelect(pack)}
      initial={{ opacity: 0, y: 20, rotate: rotation + 3 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, rotate: 0, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full text-left cursor-pointer"
      style={{ borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-display leading-tight">{pack.name}</h3>
          {pack.isMature && (
            <span className="shrink-0 ml-2" style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              18+
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] font-handwritten mb-2">by {pack.author}</p>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-3 leading-relaxed line-clamp-2">
          {pack.description}
        </p>

        {/* Card type indicators */}
        <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          <span title="Characters">{pack.cardCounts.characters} chars</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span title="Settings">{pack.cardCounts.settings} settings</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span title="Circumstances">{pack.cardCounts.circumstances} twists</span>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-disabled)] pt-2 border-t border-[var(--color-border)]">
          <span>{totalCards} cards</span>
          <div className="flex items-center gap-2">
            <span>{pack.downloads} downloads</span>
            {pack.rating > 0 && <span className="text-[var(--color-accent)]">{'★'.repeat(Math.round(pack.rating))} {pack.rating.toFixed(1)}</span>}
          </div>
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

  const cardCategories = [
    { label: 'Characters', count: pack.characters.length, rotation: -1.5 },
    { label: 'Settings', count: pack.settings.length, rotation: 1 },
    { label: 'Circumstances', count: pack.circumstances.length, rotation: -0.5 },
  ]

  return (
    <div className="space-y-5">
      {/* Header — bulletin board style */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display mb-1">
          {pack.name}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] font-handwritten">by {pack.author}</p>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed text-center">
        {pack.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
          {pack.theme}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
          {pack.downloads} downloads
        </span>
        {pack.rating > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
            ★ {pack.rating.toFixed(1)} ({pack.ratingCount})
          </span>
        )}
      </div>

      {/* Card counts — polaroid cards with rotation + tape */}
      <div className="grid grid-cols-3 gap-3">
        {cardCategories.map((cat) => (
          <motion.div
            key={cat.label}
            className="text-center p-3 rounded-xl"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-lg font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>{cat.count}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{cat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Sample cards — styled as mini ticket stubs */}
      {pack.characters.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider font-display">
            Sample Characters
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {pack.characters.slice(0, 6).map((card, i) => (
              <motion.span
                key={card.id}
                className="text-xs px-2.5 py-1 rounded-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)]"
                style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}
                whileHover={{ rotate: 0, scale: 1.05 }}
              >
                {card.name}
              </motion.span>
            ))}
            {pack.characters.length > 6 && (
              <span className="text-xs px-2.5 py-1 text-[var(--color-text-muted)] font-handwritten">
                +{pack.characters.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <motion.button
        onClick={handleUseInGame}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold"
        style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', fontSize: '15px', cursor: 'pointer' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Use in Next Game
      </motion.button>
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

  // Lock body scroll when loading overlay is visible
  useEffect(() => {
    if (loadingPack) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [loadingPack])

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
    const timeout = setTimeout(() => setLoadingPack(false), 10000)
    socket.emit('get_card_pack', pack.id, (response) => {
      clearTimeout(timeout)
      setLoadingPack(false)
      if (response.success && response.pack) {
        setSelectedPackFull(response.pack)
      }
    })
  }

  const currentPacks = activeTab === 'featured' ? featuredPacks : searchResults
  const tabs = [
    { id: 'featured' as Tab, label: 'Featured', icon: '⭐' },
    ...(searchResults.length > 0 ? [{ id: 'search' as Tab, label: `Results (${searchResults.length})`, icon: '🔍' }] : []),
  ]
  const tabRotations = [-1, 0.5]

  return (
    <main className="flex flex-col" style={{ minHeight: '100dvh', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="w-full max-w-2xl xl:max-w-4xl mx-auto pt-4 pb-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}
          >
            Explore Packs
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>
            Discover card packs to spice up your next game
          </p>
        </motion.div>

        {/* Search bar — with icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-5"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-lg pointer-events-none">🔍</span>
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Search packs..."
              className="w-full pl-10 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
              aria-label="Search card packs"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="px-5 shrink-0"
            style={{ borderRadius: '12px', fontSize: '15px', fontWeight: 600, background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: searchQuery.trim() ? 1 : 0.5 }}
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
                className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px text-sm ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton count={6} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[var(--color-surface)] rounded-2xl p-8 shadow-2xl"
            >
              <LoadingSpinner variant="theater" text="Loading pack details..." />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pack Preview Modal */}
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
