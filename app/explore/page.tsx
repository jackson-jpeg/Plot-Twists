'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGGER, SPRING_GENTLE } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState, Skeleton } from '@/components/EmptyState'
import { Button, Badge } from '@/components/ui'
import type { CardPackMetadata, CardPack } from '@/lib/types'

// ─── Sub-components ──────────────────────────────────────────

function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const [g1] = pack.gradient || ['#888', '#aaa']
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * STAGGER, ...SPRING_GENTLE }}
      style={{ paddingTop: 8, position: 'relative' }}
    >
      {/* Folder tab */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 8,
        width: 48,
        height: 8,
        borderRadius: '4px 4px 0 0',
        background: g1,
      }} />
      {/* Folder body */}
      <motion.div
        onClick={() => onSelect(pack)}
        whileHover={{ y: -3, scale: 1.01, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'linear-gradient(135deg, #d4c9a8, #c8bc98)',
          borderRadius: '4px 10px 10px 10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          padding: '12px 14px',
          color: '#1a1812',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1812' }}>{pack.name}</h3>
          {pack.isMature && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#c0392b', border: '1px solid #c0392b', borderRadius: 4, padding: '1px 4px', flexShrink: 0 }}>18+</span>
          )}
        </div>
        <p style={{ fontSize: 11, lineHeight: 1.5, color: '#5a5240', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>{pack.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#7a6e58' }}>
          {pack.rating > 0 && <span style={{ fontWeight: 600, color: '#b8860b' }}>★ {pack.rating.toFixed(1)}</span>}
          <span>{pack.downloads} plays</span>
          {pack.theme && <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{pack.theme}</span>}
        </div>
      </motion.div>
    </motion.div>
  )
}

function CategoryPills({ categories, active, onSelect }: { categories: string[]; active: string; onSelect: (cat: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
      {categories.map(cat => (
        <button key={cat}
          className="shrink-0 px-3 py-1 rounded-full border transition-colors"
          style={active === cat
            ? { background: '#ffffff', color: '#0a0909', borderColor: '#ffffff', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }
            : { background: 'transparent', color: 'var(--color-text-secondary)', borderColor: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
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

  const categories: string[] = ['All', ...Array.from(new Set(featuredPacks.map(p => p.theme).filter(Boolean)))]

  const displayPacks = isSearching
    ? searchResults
    : activeCategory === 'All'
      ? featuredPacks
      : featuredPacks.filter(p => p.theme === activeCategory)

  // ─── Handlers ────────────────────────────────────────────

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
    <div style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', background: 'var(--color-void)', minHeight: '100vh' }}>
      <div className="mx-auto px-5 pt-6 sm:pt-8 pb-8" style={{ maxWidth: 960 }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', fontSize: 25, fontWeight: 700 }}>Scripts</h1>
          <button
            onClick={toggleSearch}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: searchActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', color: searchActive ? 'white' : 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                    placeholder="Search scripts..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text-primary)', outline: 'none' }}
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

        {/* Category pills */}
        {!loading && categories.length > 1 && (
          <CategoryPills categories={categories} active={activeCategory} onSelect={setActiveCategory} />
        )}

        {/* Pack count header */}
        {!loading && displayPacks.length > 0 && (
          <div className="flex items-center justify-between mb-5">
            <span style={{ fontSize: 11, color: 'var(--color-text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
              {isSearching ? 'Search Results' : activeCategory !== 'All' ? activeCategory : 'All Scripts'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-disabled)' }}>{displayPacks.length} packs</span>
          </div>
        )}

        {/* Pack grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ paddingTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={110} />
            ))}
          </div>
        ) : displayPacks.length === 0 ? (
          isSearching ? (
            <EmptyState
              variant="search"
              title="No scripts found"
              description="Try a different search term or browse the featured scripts."
              action={{ label: 'Clear Search', onClick: toggleSearch }}
            />
          ) : (
            <EmptyState
              variant="default"
              title="No scripts found"
              description={activeCategory !== 'All' ? `No scripts in the "${activeCategory}" category.` : 'Check back soon for curated card packs!'}
              action={activeCategory !== 'All' ? { label: 'Show All', onClick: () => setActiveCategory('All') } : undefined}
            />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ paddingTop: 8 }}>
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
