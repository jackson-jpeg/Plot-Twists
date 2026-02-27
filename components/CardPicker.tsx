'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CardSelection, AvailableCards } from '@/lib/types'
import { ContentItem, CATEGORIES } from '@/lib/content-types'
import { getFilteredContentRich } from '@/lib/content'
import { MOTION } from '@/lib/animations'
import { tapHaptic } from '@/hooks/useHaptics'

type TabKey = 'character' | 'setting' | 'circumstance'

const TABS: { key: TabKey; label: string; icon: string; shortLabel: string; contentType: 'characters' | 'settings' | 'circumstances'; color: string; maxCustomLength: number }[] = [
  { key: 'character', label: 'Character', icon: '🎭', shortLabel: 'Char.', contentType: 'characters', color: 'var(--color-accent)', maxCustomLength: 50 },
  { key: 'setting', label: 'Setting', icon: '🏛️', shortLabel: 'Setting', contentType: 'settings', color: 'var(--color-accent-2)', maxCustomLength: 50 },
  { key: 'circumstance', label: 'Circumstance', icon: '⚡', shortLabel: 'Circ.', contentType: 'circumstances', color: 'var(--color-warning)', maxCustomLength: 80 },
]

export interface CardPickerProps {
  selection: CardSelection
  setSelection: (s: CardSelection) => void
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
  const [customMode, setCustomMode] = useState<Record<TabKey, boolean>>({ character: false, setting: false, circumstance: false })
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

  // Scroll selected card into view when revisiting a tab
  useEffect(() => {
    if (!gridRef.current) return
    const selectedEl = gridRef.current.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
        if (a.name === currentValue) return -1
        if (b.name === currentValue) return 1
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
  const selectCard = useCallback((name: string) => {
    const newSelection = { ...selection, [activeTab]: name }
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
      while (pick === current) pick = cards[Math.floor(Math.random() * cards.length)]
    }
    selectCard(pick)
    toast.success('Shuffled! 🎲', { duration: 1500 })
  }, [availableCards, activeTabConfig, selection, activeTab, selectCard, toast])

  // Clear a card
  const clearCard = useCallback((tab: TabKey) => {
    setSelection({ ...selection, [tab]: '' })
    setActiveTab(tab)
  }, [selection, setSelection])

  // Toggle custom mode for current tab
  const toggleCustom = useCallback(() => {
    const entering = !customMode[activeTab]
    setCustomMode(prev => ({ ...prev, [activeTab]: entering }))
    if (entering) {
      setSelection({ ...selection, [activeTab]: '' })
    }
  }, [customMode, activeTab, selection, setSelection])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    searchInputRef.current?.focus()
  }, [])

  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length
  const noCardsSelected = selectedCount === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
          <span aria-hidden="true">🎴 </span>Pick Your Cards
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {TABS.map(tab => (
              <motion.div
                key={tab.key}
                className="w-3 h-3 rounded-full"
                animate={{
                  backgroundColor: selection[tab.key] ? 'var(--color-success)' : 'var(--color-border)',
                  scale: selection[tab.key] ? 1 : 0.75,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            ))}
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{selectedCount}/3</span>
        </div>
      </div>

      {/* Shuffle All (only when no cards selected) */}
      {noCardsSelected && !customMode.character && !customMode.setting && !customMode.circumstance && availableCards.characters.length > 0 && (
        <motion.button
          onClick={() => { onShuffleAll(); toast.success('Shuffled! 🎲', { duration: 1500 }) }}
          className="w-full"
          style={{ background: 'linear-gradient(135deg, var(--color-highlight-pink), var(--color-highlight-yellow))', border: '2px solid var(--color-accent)', fontWeight: 'bold', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', color: 'var(--color-text-primary)' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <span aria-hidden="true">🎲</span><span>Feeling Lucky? Shuffle All!</span>
        </motion.button>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: 'var(--color-surface-alt)' }} role="tablist">
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
              className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg font-semibold text-sm relative overflow-hidden"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-2)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10" aria-hidden="true">{tab.icon}</span>
              <span className="relative z-10 hidden min-[420px]:inline">{tab.label}</span>
              <span className="relative z-10 inline min-[420px]:hidden">{tab.shortLabel}</span>
              {hasValue && (
                <motion.span
                  className="relative z-10"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  style={{ color: 'var(--color-success)', fontSize: '12px' }}
                  aria-hidden="true"
                >
                  ✓
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
          {customMode[activeTab] ? (
            /* Custom Input Mode */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" aria-hidden="true">{activeTabConfig.icon}</span>
                <span className="font-display text-base" style={{ color: 'var(--color-text-primary)' }}>
                  Write your own {activeTabConfig.label.toLowerCase()}
                </span>
              </div>
              <input
                type="text"
                value={selection[activeTab]}
                onChange={(e) => setSelection({ ...selection, [activeTab]: e.target.value })}
                placeholder={`Enter custom ${activeTabConfig.label.toLowerCase()}...`}
                maxLength={activeTabConfig.maxCustomLength}
                className="input font-script text-lg"
                style={{ background: 'var(--color-surface-alt)', border: `2px solid ${activeTabConfig.color}`, fontStyle: 'italic' }}
                aria-label={`Custom ${activeTabConfig.label.toLowerCase()}`}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleCustom}
                  className="text-sm flex items-center gap-1 py-1"
                  style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                >
                  <span aria-hidden="true">🃏</span> Browse cards instead
                </button>
                <span className="text-xs" style={{ color: (selection[activeTab] || '').length > activeTabConfig.maxCustomLength * 0.8 ? 'var(--color-warning)' : 'var(--color-text-disabled)' }}>
                  {(selection[activeTab] || '').length}/{activeTabConfig.maxCustomLength}
                </span>
              </div>
            </div>
          ) : (
            /* Browse Mode */
            <div className="flex flex-col gap-3">
              {/* Search + Shuffle Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTabConfig.label.toLowerCase()}s...`}
                    className="input w-full"
                    style={{ paddingLeft: '40px', paddingRight: searchQuery ? '36px' : '12px' }}
                    aria-label={`Search ${activeTabConfig.label.toLowerCase()}s`}
                  />
                  <span
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"
                    style={{ pointerEvents: 'none' }}
                    aria-hidden="true"
                  >
                    🔍
                  </span>
                  {/* Clear search button */}
                  {searchQuery && (
                    <motion.button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{ width: '36px', height: '36px', background: 'var(--color-surface-alt)', color: 'var(--color-text-tertiary)', fontSize: '14px', border: 'none', cursor: 'pointer' }}
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      whileTap={{ scale: 0.85 }}
                      aria-label="Clear search"
                    >
                      ✕
                    </motion.button>
                  )}
                </div>
                <motion.button
                  onClick={shuffleCurrentTab}
                  style={{ padding: '8px 14px', fontSize: '20px', flexShrink: 0, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Shuffle ${activeTabConfig.label.toLowerCase()}`}
                >
                  🎲
                </motion.button>
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
                          className="flex items-center gap-1 px-3 py-2 rounded-full whitespace-nowrap"
                          style={{
                            background: isSelected ? activeTabConfig.color : 'var(--color-surface-alt)',
                            color: isSelected ? 'white' : 'var(--color-text-secondary)',
                            border: `1px solid ${isSelected ? activeTabConfig.color : 'var(--color-border)'}`,
                            fontSize: '14px',
                            fontWeight: isSelected ? 600 : 400,
                            flexShrink: 0,
                            minHeight: '36px',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span aria-hidden="true">{category.emoji}</span>
                          <span>{category.name}</span>
                          <span style={{ fontSize: '11px', opacity: 0.65, marginLeft: '1px' }}>
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
                      style={{ background: 'linear-gradient(to right, transparent, var(--color-surface))' }}
                    />
                  )}
                </div>
              )}

              {/* Results Count + Write-your-own */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {filteredItems.length} {filteredItems.length === 1 ? 'option' : 'options'}
                  {debouncedQuery && ` for "${debouncedQuery}"`}
                </span>
                <button
                  onClick={toggleCustom}
                  className="text-sm flex items-center gap-1 px-3 py-2 rounded-md transition-colors"
                  style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', cursor: 'pointer', minHeight: '36px' }}
                >
                  ✎ Write your own
                </button>
              </div>

              {/* Card Grid — viewport-relative height */}
              <div
                ref={gridRef}
                className="overflow-y-auto scrollbar-thin"
                style={{ maxHeight: 'clamp(200px, 42vh, 400px)', overscrollBehavior: 'contain' }}
              >
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2" aria-hidden="true">🔍</div>
                    <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>No matches found</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Try a different search or clear your filters</p>
                    {(searchQuery || selectedCategories.length > 0) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategories([]) }}
                        className="text-xs mt-3"
                        style={{ color: activeTabConfig.color, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 max-[380px]:grid-cols-2 gap-2">
                    {filteredItems.map((item, index) => {
                      const isSelected = item.name === selection[activeTab]
                      return (
                        <motion.button
                          key={item.id}
                          data-selected={isSelected || undefined}
                          onClick={() => selectCard(item.name)}
                          className="text-left p-2.5 rounded-lg relative"
                          style={{
                            background: isSelected ? `${activeTabConfig.color}15` : 'var(--color-surface-alt)',
                            border: isSelected ? `2px solid ${activeTabConfig.color}` : '1px solid var(--color-border)',
                            boxShadow: isSelected ? `0 0 10px ${activeTabConfig.color}25` : 'none',
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: isSelected ? 1.03 : 1,
                          }}
                          transition={{ duration: 0.12, delay: Math.min(index * 0.015, 0.3) }}
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <p className="font-semibold text-xs leading-tight line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>
                            {item.name}
                          </p>
                          {item.source && (
                            <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                              {item.source}
                            </p>
                          )}
                          {isSelected && (
                            <motion.div
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: activeTabConfig.color }}
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                              <span className="text-white" style={{ fontSize: '10px', lineHeight: 1 }} aria-hidden="true">✓</span>
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

      {/* Selected Summary — pill-style cards */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
        layout
      >
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>YOUR CARDS</span>
          {selectedCount === 3 && (
            <motion.span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Ready!
            </motion.span>
          )}
        </div>
        <div className="p-2 flex flex-col gap-1.5">
          {TABS.map(tab => {
            const value = selection[tab.key]
            return (
              <motion.div
                key={tab.key}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm"
                style={{
                  background: value ? `${tab.color}10` : 'transparent',
                  border: value ? `1px solid ${tab.color}30` : '1px dashed var(--color-border)',
                }}
                animate={{ scale: value ? 1 : 0.98, opacity: value ? 1 : 0.7 }}
                transition={{ duration: 0.15 }}
              >
                <span className="flex-shrink-0" style={{ fontSize: '14px' }} aria-hidden="true">{tab.icon}</span>
                {value ? (
                  <>
                    <span className="font-semibold truncate flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
                    <motion.button
                      onClick={() => clearCard(tab.key)}
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', width: '36px', height: '36px', fontSize: '13px', lineHeight: 1 }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      aria-label={`Clear ${tab.label}`}
                    >
                      ✕
                    </motion.button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className="text-xs italic flex-1 text-left py-0.5"
                    style={{ color: 'var(--color-text-disabled)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                  >
                    Tap to pick {tab.label.toLowerCase()}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
