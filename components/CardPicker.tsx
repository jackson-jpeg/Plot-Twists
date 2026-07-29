'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AvailableCards, CardOption, SelectedCards } from '@/lib/types'
import { ContentItem, CATEGORIES } from '@/lib/content-types'
import { getFilteredContentRich } from '@/lib/content'
import { SPRING, SPRING_BOUNCY } from '@/lib/motion'
import { tapHaptic } from '@/hooks/useHaptics'

type TabKey = 'character' | 'setting' | 'circumstance'

const TABS: { key: TabKey; label: string; subtitle: string; icon: string; shortLabel: string; contentType: 'characters' | 'settings' | 'circumstances'; color: string }[] = [
  { key: 'character', label: 'Character', subtitle: 'Who is in this scene?', icon: '🎭', shortLabel: 'Char.', contentType: 'characters', color: 'var(--color-stage-red)' },
  { key: 'setting', label: 'Setting', subtitle: 'Where does this scene take place?', icon: '🏛️', shortLabel: 'Setting', contentType: 'settings', color: 'var(--color-stage-blue)' },
  { key: 'circumstance', label: 'Wild Card', subtitle: 'What twist makes it interesting?', icon: '⚡', shortLabel: 'Wild', contentType: 'circumstances', color: 'var(--color-stage-gold)' },
]

export interface CardPickerProps {
  selection: SelectedCards
  setSelection: (s: SelectedCards) => void
  isMature: boolean
  availableCards: AvailableCards
  onShuffleAll: () => void
  toast: { success: (m: string, opts?: { duration?: number }) => void }
}

export function CardPicker({
  selection,
  setSelection,
  isMature,
  availableCards,
  onShuffleAll,
  toast,
}: CardPickerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('character')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [chipScrollable, setChipScrollable] = useState(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const chipContainerRef = useRef<HTMLDivElement>(null)

  const activeTabConfig = TABS.find(t => t.key === activeTab)!

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset search when switching tabs
  useEffect(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setSelectedCategories([])
  }, [activeTab])

  // Scroll selected card into view when revisiting a tab, or reset scroll
  useEffect(() => {
    if (!gridRef.current) return
    const selectedEl = gridRef.current.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    } else {
      gridRef.current.scrollTop = 0
    }
  }, [activeTab])

  // Rich content from the content library
  const richContent = useMemo(() => getFilteredContentRich({ isMature }), [isMature])

  // Content items for the active tab
  const contentItems = richContent[activeTabConfig.contentType]

  // Available categories for this tab's content, with counts
  const availableCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>()
    contentItems.forEach(item => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
    })
    return CATEGORIES
      .filter(cat => categoryCounts.has(cat.id))
      .map(cat => ({ ...cat, count: categoryCounts.get(cat.id) || 0 }))
  }, [contentItems])

  // Detect if chip container overflows (for fade affordance)
  useEffect(() => {
    const el = chipContainerRef.current
    if (!el) return
    setChipScrollable(el.scrollWidth > el.clientWidth)
  }, [activeTab, availableCategories])

  // Filtered items based on search + category chips
  const filteredItems = useMemo(() => {
    let filtered = contentItems

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => selectedCategories.includes(item.category))
    }

    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query))
      )
    }

    // Sort: selected card first so it's always visible
    const currentValue = selection[activeTab]
    if (currentValue) {
      filtered = [...filtered].sort((a, b) => {
        if (a.id === currentValue.id) return -1
        if (b.id === currentValue.id) return 1
        return 0
      })
    }

    return filtered
  }, [contentItems, selectedCategories, debouncedQuery, selection, activeTab])

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  // Select a card for the active tab
  const selectCard = useCallback((card: CardOption) => {
    const newSelection = { ...selection, [activeTab]: card }
    setSelection(newSelection)
    tapHaptic()
    if ('vibrate' in navigator) navigator.vibrate(50)

    // Auto-advance to next empty tab after a short delay
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    autoAdvanceTimer.current = setTimeout(() => {
      const tabOrder: TabKey[] = ['character', 'setting', 'circumstance']
      const currentIdx = tabOrder.indexOf(activeTab)
      for (let i = 1; i <= tabOrder.length; i++) {
        const nextTab = tabOrder[(currentIdx + i) % tabOrder.length]
        if (!newSelection[nextTab]) {
          setActiveTab(nextTab)
          return
        }
      }
      // All filled — stay on current tab
    }, 400)
  }, [selection, setSelection, activeTab])

  // Shuffle current tab's card
  const shuffleCurrentTab = useCallback(() => {
    const cards = availableCards[activeTabConfig.contentType]
    if (cards.length === 0) return
    const current = selection[activeTab]
    let pick = cards[Math.floor(Math.random() * cards.length)]
    if (cards.length > 1) {
      while (pick.id === current?.id) pick = cards[Math.floor(Math.random() * cards.length)]
    }
    selectCard(pick)
    toast.success('Shuffled! 🎲', { duration: 1500 })
  }, [availableCards, activeTabConfig, selection, activeTab, selectCard, toast])

  // Clear a card
  const clearCard = useCallback((tab: TabKey) => {
    setSelection({ ...selection, [tab]: null })
    setActiveTab(tab)
  }, [selection, setSelection])

  // NOTE: "✎ Write your own" lived here and is gone deliberately. It was the
  // client half of defect D1 — free text typed here went straight into the
  // Claude system prompt. The server no longer has a path for it (submit_cards
  // takes catalog IDs), so the button could only ever fail now. IP layer 2.
  // If it comes back it has to come back as user-authored *cards* with IDs,
  // i.e. via the card-pack system, not as a text box on the submit path.

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    searchInputRef.current?.focus()
  }, [])

  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length
  const noCardsSelected = selectedCount === 0

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: 'rgba(255,255,255,0.92)', margin: 0 }}>
          Pick Your Cards
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {TABS.map(tab => (
              <motion.div
                key={tab.key}
                className="w-3 h-3 rounded-full"
                animate={{
                  backgroundColor: selection[tab.key] ? 'var(--color-success)' : 'rgba(255,255,255,0.15)',
                  scale: selection[tab.key] ? 1 : 0.75,
                }}
                transition={SPRING_BOUNCY}
              />
            ))}
          </div>
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedCount}/3</span>
        </div>
      </div>

      {/* Shuffle All (only when no cards selected) */}
      {noCardsSelected && availableCards.characters.length > 0 && (
        <motion.button
          onClick={() => { onShuffleAll(); toast.success('Shuffled! 🎲', { duration: 1500 }) }}
          className="w-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 600, padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <span aria-hidden="true">🎲 </span><span>Feeling Lucky? Shuffle All!</span>
        </motion.button>
      )}

      {/* Tabs */}
      <div className="flex gap-0" style={{ background: 'var(--color-ink)', borderRadius: '10px', padding: '2px' }} role="tablist">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const hasValue = !!selection[tab.key]
          return (
            <motion.button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.label}${hasValue ? ' (selected)' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-2 relative overflow-hidden"
              style={{
                color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                fontSize: '12px',
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-2 right-2"
                  style={{
                    height: '2px',
                    background: tab.color,
                    borderRadius: '1px',
                  }}
                  transition={SPRING}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: tab.color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <span className="hidden min-[420px]:inline">{tab.label}</span>
                <span className="inline min-[420px]:hidden">{tab.shortLabel}</span>
              </span>
              {hasValue && (
                <motion.span
                  className="relative z-10"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING_BOUNCY}
                  style={{ color: 'var(--color-success)', fontSize: '10px', lineHeight: 1, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {selection[tab.key]?.name}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.15 }}
        >
          {(
            /* Browse Mode */
            <div className="flex flex-col gap-3">
              {/* Category heading */}
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 400, color: 'rgba(255,255,255,0.9)', margin: '0 0 2px 0' }}>
                  {activeTabConfig.label}
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{activeTabConfig.subtitle}</p>
              </div>

              {/* Search + Shuffle Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTabConfig.label.toLowerCase()}s...`}
                    inputMode="search"
                    enterKeyHint="search"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)', outline: 'none', paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                    aria-label={`Search ${activeTabConfig.label.toLowerCase()}s`}
                  />
                  <span
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
                    style={{ pointerEvents: 'none', color: 'rgba(255,255,255,0.3)' }}
                    aria-hidden="true"
                  >
                    &#x1F50D;
                  </span>
                  {/* Clear search button */}
                  {searchQuery && (
                    <motion.button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={SPRING_BOUNCY}
                      whileTap={{ scale: 0.85 }}
                      aria-label="Clear search"
                    >
                      ✕
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Category Chips */}
              {availableCategories.length > 1 && (
                <div className="relative">
                  <div
                    ref={chipContainerRef}
                    className="flex gap-1.5 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
                    onScroll={() => {
                      const el = chipContainerRef.current
                      if (el) setChipScrollable(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
                    }}
                  >
                    {availableCategories.map(category => {
                      const isSelected = selectedCategories.includes(category.id)
                      return (
                        <motion.button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap"
                          style={{
                            background: isSelected ? activeTabConfig.color : 'rgba(255,255,255,0.06)',
                            color: isSelected ? 'white' : 'rgba(255,255,255,0.55)',
                            border: `1px solid ${isSelected ? activeTabConfig.color : 'rgba(255,255,255,0.1)'}`,
                            fontSize: '12px',
                            fontWeight: isSelected ? 600 : 500,
                            flexShrink: 0,
                            minHeight: '32px',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span aria-hidden="true">{category.emoji}</span>
                          <span>{category.name}</span>
                          <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '1px' }}>
                            {category.count}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                  {/* Fade affordance when scrollable */}
                  {chipScrollable && (
                    <div
                      className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, var(--color-void))' }}
                    />
                  )}
                </div>
              )}

              {/* Results Count + Shuffle + Write-your-own */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'option' : 'options'}
                    {debouncedQuery && ` for "${debouncedQuery}"`}
                  </span>
                  <button
                    onClick={shuffleCurrentTab}
                    style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', textUnderlineOffset: '2px', padding: '2px 0' }}
                    aria-label={`Shuffle ${activeTabConfig.label.toLowerCase()}`}
                  >
                    &#x21bb; Shuffle cards
                  </button>
                </div>
              </div>

              {/* Card Grid — viewport-relative height */}
              <div
                ref={gridRef}
                className="overflow-y-auto scrollbar-thin"
                style={{ maxHeight: 'clamp(200px, 42vh, 400px)', overscrollBehavior: 'contain' }}
              >
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2" aria-hidden="true">&#x1F50D;</div>
                    <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>No matches found</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Try a different search or clear your filters</p>
                    {(searchQuery || selectedCategories.length > 0) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategories([]) }}
                        className="text-xs mt-3"
                        style={{ color: activeTabConfig.color, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredItems.map((item, index) => {
                      const isSelected = item.id === selection[activeTab]?.id
                      return (
                        <motion.button
                          key={item.id}
                          data-selected={isSelected || undefined}
                          onClick={() => selectCard({ id: item.id, name: item.name })}
                          className="text-left relative overflow-hidden"
                          style={{
                            background: isSelected ? '#ffffff' : 'var(--color-cream)',
                            border: isSelected ? `2px solid ${activeTabConfig.color}` : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '10px',
                            boxShadow: isSelected ? `0 2px 8px rgba(0,0,0,0.25)` : '0 1px 4px rgba(0,0,0,0.2)',
                            padding: '0',
                            cursor: 'pointer',
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: isSelected ? 1.03 : 1,
                          }}
                          transition={{ duration: 0.12, delay: Math.min(index * 0.015, 0.3) }}
                          whileHover={{ scale: 1.04, y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Category color stripe */}
                          <div style={{ height: '3px', background: activeTabConfig.color, borderRadius: '10px 10px 0 0' }} />
                          <div style={{ padding: '10px 10px 8px' }}>
                            <p style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.3, color: '#1a1812', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {item.name}
                            </p>
                            {item.source && (
                              <p style={{ fontSize: '9px', color: '#8a8578', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.source}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <motion.div
                              className="absolute flex items-center justify-center"
                              style={{ top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: activeTabConfig.color }}
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={SPRING_BOUNCY}
                            >
                              <span className="text-white" style={{ fontSize: '11px', lineHeight: 1, fontWeight: 700 }} aria-hidden="true">✓</span>
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Summary — mini card slots */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-ink)', border: '1px solid rgba(255,255,255,0.08)' }}
        layout
      >
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>YOUR CARDS</span>
          {selectedCount === 3 && (
            <motion.span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(76,175,80,0.15)', color: 'var(--color-success)' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={SPRING_BOUNCY}
            >
              Ready!
            </motion.span>
          )}
        </div>
        {/* Three mini card slots in a row */}
        <div className="p-2.5 flex gap-2">
          {TABS.map(tab => {
            const value = selection[tab.key]
            return (
              <motion.div
                key={tab.key}
                className="flex-1 flex flex-col items-center justify-center rounded-lg relative"
                style={{
                  minHeight: '52px',
                  padding: '6px 8px',
                  background: value ? `color-mix(in srgb, ${tab.color} 12%, transparent)` : 'transparent',
                  border: value ? `1.5px solid ${tab.color}` : '1.5px dashed rgba(255,255,255,0.12)',
                  cursor: value ? 'default' : 'pointer',
                }}
                animate={{ scale: value ? 1 : 0.97, opacity: value ? 1 : 0.5 }}
                transition={{ duration: 0.15 }}
                onClick={() => !value && setActiveTab(tab.key)}
              >
                {value ? (
                  <>
                    <span className="font-semibold text-center leading-tight" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', width: '100%' }}>{value.name}</span>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); clearCard(tab.key) }}
                      className="absolute flex items-center justify-center"
                      style={{ top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: '9px', lineHeight: 1, border: 'none', cursor: 'pointer' }}
                      whileTap={{ scale: 0.85 }}
                      aria-label={`Clear ${tab.label}`}
                    >
                      ✕
                    </motion.button>
                  </>
                ) : (
                  <>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tab.color, opacity: 0.4, marginBottom: '4px' }} />
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tab.shortLabel}</span>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
