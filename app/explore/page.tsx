'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGGER } from '@/lib/animations'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState, Skeleton } from '@/components/EmptyState'
import { Button, Badge, Card, PageContainer, SectionHeader } from '@/components/ui'
import type { CardPackMetadata, CardPack } from '@/lib/types'

type Tab = 'featured' | 'search'

function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const totalCards = pack.cardCounts.characters + pack.cardCounts.settings + pack.cardCounts.circumstances

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * STAGGER.fast, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full text-left"
    >
      <Card variant="interactive" padding="none" onClick={() => onSelect(pack)} style={{ overflow: 'hidden' }}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] font-display leading-tight">{pack.name}</h3>
            {pack.isMature && (
              <Badge variant="danger" size="md" className="shrink-0 ml-2">18+</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] font-display mb-2">by {pack.author}</p>
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
              {pack.rating > 0 && (
                <Badge variant="accent" size="sm">{'★'.repeat(Math.round(pack.rating))} {pack.rating.toFixed(1)}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
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
        <p className="text-sm text-[var(--color-text-muted)] font-display">by {pack.author}</p>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed text-center">
        {pack.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="default" size="md">{pack.theme}</Badge>
        <Badge variant="default" size="md">{pack.downloads} downloads</Badge>
        {pack.rating > 0 && (
          <Badge variant="accent" size="md">★ {pack.rating.toFixed(1)} ({pack.ratingCount})</Badge>
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
              <span className="text-xs px-2.5 py-1 text-[var(--color-text-muted)] font-display">
                +{pack.characters.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button variant="primary" size="lg" fullWidth onClick={handleUseInGame}>
        Use in Next Game
      </Button>
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
  const [loading, setLoading] = useState(true)
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

  // Reset loading when socket connects but no featured packs load
  useEffect(() => {
    if (!isConnected) return
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timeout)
  }, [isConnected])

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

  // Debounced search on typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (searchResults.length > 0) {
        setSearchResults([])
        setActiveTab('featured')
      }
      return
    }
    const debounce = setTimeout(() => {
      handleSearch()
    }, 400)
    return () => clearTimeout(debounce)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

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
  return (
    <PageContainer size="wide" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="pt-6 sm:pt-8 pb-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <SectionHeader title="Explore Packs" align="left" />
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
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
              aria-label="Search card packs"
            />
          </div>
          <Button onClick={handleSearch} disabled={!searchQuery.trim()} size="md" className="shrink-0">
            Search
          </Button>
        </motion.div>

        {/* Pill tabs */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: isActive ? 'var(--color-text-primary)' : 'transparent',
                  color: isActive ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
                  border: isActive ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Pack grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={180} />
            ))}
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
    </PageContainer>
  )
}
