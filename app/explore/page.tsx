'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGGER, SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState, Skeleton } from '@/components/EmptyState'
import { Button, Badge, Card } from '@/components/ui'
import type { CardPackMetadata, CardPack } from '@/lib/types'

// ─── Sub-components ──────────────────────────────────────────

function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const [g1, g2] = pack.gradient || ['#888', '#aaa']
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * STAGGER, ...SPRING_GENTLE }}
    >
      <Card variant="interactive" padding="none" onClick={() => onSelect(pack)} style={{ overflow: 'hidden' }}>
        <div className="flex gap-0">
          <div className="w-1 rounded-l-xl shrink-0" style={{ background: `linear-gradient(180deg, ${g1}, ${g2})` }} />
          <div className="p-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{pack.name}</h3>
              {pack.isMature && <Badge variant="danger" size="sm">18+</Badge>}
            </div>
            <p className="text-[13px] leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--color-text-secondary)' }}>{pack.description}</p>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
              {pack.rating > 0 && <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>★ {pack.rating.toFixed(1)}</span>}
              <span>{pack.downloads} plays</span>
              {pack.theme && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-tertiary)' }}>{pack.theme}</span>}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function TrendingCard({ pack, rank, onSelect }: { pack: CardPackMetadata; rank: number; onSelect: (pack: CardPackMetadata) => void }) {
  const [g1, g2] = pack.gradient || ['#888', '#aaa']
  return (
    <motion.div
      className="shrink-0 cursor-pointer rounded-2xl overflow-hidden relative"
      style={{ width: 220, scrollSnapAlign: 'start' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(pack)}
    >
      <div className="h-[130px] relative" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
        <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>{rank}</div>
        <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
          <h3 className="text-sm font-bold text-white">{pack.name}</h3>
          <div className="flex gap-2 text-[11px] text-white/70 mt-0.5">
            <span>★ {pack.rating.toFixed(1)}</span>
            <span>{pack.downloads} plays</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function QuickPlayBanner({ onQuickPlay }: { onQuickPlay: () => void }) {
  return (
    <motion.div {...ENTER_Y} transition={SPRING_GENTLE}
      className="rounded-2xl p-5 mb-7 flex items-center justify-between gap-4"
      style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', color: 'white' }}
    >
      <div>
        <h3 className="text-[17px] font-bold mb-0.5">Feeling lucky?</h3>
        <p className="text-[13px] text-white/50">Random pack, instant scene. No decisions required.</p>
      </div>
      <button className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-accent)', color: 'white' }} onClick={(e) => { e.stopPropagation(); onQuickPlay() }}>Quick Play</button>
    </motion.div>
  )
}

function CategoryPills({ categories, active, onSelect }: { categories: string[]; active: string; onSelect: (cat: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
      {categories.map(cat => (
        <button key={cat}
          className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
          style={active === cat
            ? { background: 'var(--color-text-primary)', color: 'white', borderColor: 'var(--color-text-primary)' }
            : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
          onClick={() => onSelect(cat)}
        >{cat}</button>
      ))}
    </div>
  )
}

// ─── Pack Preview Modal Content (preserved) ──────────────────

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
      {/* Header */}
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

      {/* Card counts */}
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

      {/* Sample cards */}
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

// ─── Main Page ───────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const [featuredPacks, setFeaturedPacks] = useState<CardPackMetadata[]>([])
  const [searchResults, setSearchResults] = useState<CardPackMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPackFull, setSelectedPackFull] = useState<CardPack | null>(null)
  const [loadingPack, setLoadingPack] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  const isSearching = searchActive && searchQuery.trim().length > 0

  // ─── Data fetching ───────────────────────────────────────

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
      }
    })
  }, [socket, isConnected, searchQuery])

  // Debounced search on typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (searchResults.length > 0) {
        setSearchResults([])
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

  // ─── Derived data ────────────────────────────────────────

  const trendingPacks = [...featuredPacks].sort((a, b) => b.downloads - a.downloads).slice(0, 5)

  const categories: string[] = ['All', ...Array.from(new Set(featuredPacks.map(p => p.theme).filter(Boolean)))]

  const displayPacks = isSearching
    ? searchResults
    : activeCategory === 'All'
      ? featuredPacks
      : featuredPacks.filter(p => p.theme === activeCategory)

  // ─── Handlers ────────────────────────────────────────────

  const handleQuickPlay = () => {
    if (featuredPacks.length === 0) return
    const randomPack = featuredPacks[Math.floor(Math.random() * featuredPacks.length)]
    try {
      localStorage.setItem('selectedPackId', randomPack.id)
    } catch { /* ignore */ }
    router.push('/host')
  }

  const toggleSearch = () => {
    if (searchActive) {
      setSearchActive(false)
      setSearchQuery('')
      setSearchResults([])
    } else {
      setSearchActive(true)
    }
  }

  // ─── Render ──────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="mx-auto px-5 pt-6 sm:pt-8 pb-8" style={{ maxWidth: 960 }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Explore</h1>
          <button
            onClick={toggleSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: searchActive ? 'var(--color-text-primary)' : 'var(--color-surface-alt)', color: searchActive ? 'white' : 'var(--color-text-secondary)' }}
            aria-label={searchActive ? 'Close search' : 'Search packs'}
          >
            {searchActive ? '\u00d7' : '\u{1F50D}'}
          </button>
        </motion.div>

        {/* Search input (conditionally visible) */}
        <AnimatePresence>
          {searchActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="Search packs..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                    aria-label="Search card packs"
                    autoFocus
                  />
                </div>
                <Button onClick={handleSearch} disabled={!searchQuery.trim()} size="md" className="shrink-0">
                  Search
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Play Banner (hidden during search) */}
        {!isSearching && !loading && featuredPacks.length > 0 && (
          <QuickPlayBanner onQuickPlay={handleQuickPlay} />
        )}

        {/* Trending section (hidden during search) */}
        {!isSearching && !loading && trendingPacks.length > 0 && (
          <motion.div {...ENTER_Y} transition={{ ...SPRING_GENTLE, delay: 0.05 }} className="mb-7">
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Trending</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {trendingPacks.map((pack, i) => (
                <TrendingCard key={pack.id} pack={pack} rank={i + 1} onSelect={handleSelectPack} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Category pills */}
        {!loading && categories.length > 1 && (
          <CategoryPills categories={categories} active={activeCategory} onSelect={setActiveCategory} />
        )}

        {/* All Packs section header */}
        {!loading && displayPacks.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isSearching ? 'Search Results' : 'All Packs'}
            </h2>
            <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>{displayPacks.length} packs</span>
          </div>
        )}

        {/* Pack grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={120} />
            ))}
          </div>
        ) : displayPacks.length === 0 ? (
          isSearching ? (
            <EmptyState
              variant="search"
              title="No packs found"
              description="Try a different search term or browse the featured packs."
              action={{ label: 'Clear Search', onClick: toggleSearch }}
            />
          ) : (
            <EmptyState
              variant="default"
              title="No packs found"
              description={activeCategory !== 'All' ? `No packs in the "${activeCategory}" category.` : 'Check back soon for curated card packs!'}
              action={activeCategory !== 'All' ? { label: 'Show All', onClick: () => setActiveCategory('All') } : undefined}
            />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayPacks.map((pack, index) => (
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
    </div>
  )
}
