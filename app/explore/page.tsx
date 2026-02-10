'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import type { CardPackMetadata, CardPack } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'

type Tab = 'featured' | 'search'

function PackCard({ pack, onSelect }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void }) {
  return (
    <motion.button
      onClick={() => onSelect(pack)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{pack.name}</h3>
        {pack.isMature && (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--color-error)',
            color: 'white',
            fontWeight: 700,
          }}>
            18+
          </span>
        )}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
        {pack.description}
      </p>
      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        <span>by {pack.author}</span>
        <span>{pack.cardCounts.characters + pack.cardCounts.settings + pack.cardCounts.circumstances} cards</span>
        <span>{pack.downloads} downloads</span>
        {pack.rating > 0 && <span>{'★'.repeat(Math.round(pack.rating))} {pack.rating.toFixed(1)}</span>}
      </div>
    </motion.button>
  )
}

function PackPreviewModal({
  pack,
  onClose,
}: {
  pack: CardPack | null
  onClose: () => void
}) {
  const router = useRouter()

  if (!pack) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              {pack.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>by {pack.author}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          {pack.description}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            {pack.theme}
          </span>
          <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            {pack.downloads} downloads
          </span>
          {pack.rating > 0 && (
            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
              ★ {pack.rating.toFixed(1)} ({pack.ratingCount} ratings)
            </span>
          )}
        </div>

        {/* Card counts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: 'Characters', count: pack.characters.length, icon: '🎭' },
            { label: 'Settings', count: pack.settings.length, icon: '🏠' },
            { label: 'Circumstances', count: pack.circumstances.length, icon: '🌀' },
          ].map((cat) => (
            <div key={cat.label} style={{
              textAlign: 'center',
              padding: '12px 8px',
              background: 'var(--color-surface-alt)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{cat.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cat.count}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{cat.label}</div>
            </div>
          ))}
        </div>

        {/* Sample cards */}
        {pack.characters.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sample Characters
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {pack.characters.slice(0, 6).map((card) => (
                <span key={card.id} style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}>
                  {card.name}
                </span>
              ))}
              {pack.characters.length > 6 && (
                <span style={{ fontSize: '12px', padding: '4px 10px', color: 'var(--color-text-muted)' }}>
                  +{pack.characters.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push(`/host?pack=${pack.id}`)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'white',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Use in Next Game
        </button>
      </motion.div>
    </div>
  )
}

export default function ExplorePage() {
  const { socket, isConnected } = useSocket()
  const [activeTab, setActiveTab] = useState<Tab>('featured')
  const [featuredPacks, setFeaturedPacks] = useState<CardPackMetadata[]>([])
  const [searchResults, setSearchResults] = useState<CardPackMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPackFull, setSelectedPackFull] = useState<CardPack | null>(null)

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
    socket.emit('get_card_pack', pack.id, (response) => {
      if (response.success && response.pack) {
        setSelectedPackFull(response.pack)
      }
    })
  }

  const currentPacks = activeTab === 'featured' ? featuredPacks : searchResults

  return (
    <main className="page-container" style={{ minHeight: '100dvh' }}>
      <div className="container max-w-2xl" style={{ padding: '24px 16px' }}>
        <motion.div {...VARIANTS.fadeInUp}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Explore
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Discover card packs to use in your next game
          </p>
        </motion.div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search packs..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-accent)',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
              opacity: searchQuery.trim() ? 1 : 0.5,
            }}
          >
            Search
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {[
            { id: 'featured' as Tab, label: 'Featured Packs' },
            ...(searchResults.length > 0 ? [{ id: 'search' as Tab, label: `Results (${searchResults.length})` }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-border)',
                background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pack grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            Loading...
          </div>
        ) : currentPacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            {activeTab === 'search' ? 'No packs found. Try a different search.' : 'No featured packs available yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentPacks.map((pack) => (
              <PackCard key={pack.id} pack={pack} onSelect={handleSelectPack} />
            ))}
          </div>
        )}
      </div>

      {/* Pack Preview Modal */}
      <AnimatePresence>
        {selectedPackFull && (
          <PackPreviewModal
            pack={selectedPackFull}
            onClose={() => setSelectedPackFull(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
