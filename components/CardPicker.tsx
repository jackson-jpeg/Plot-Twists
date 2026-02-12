'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CardSelection, AvailableCards } from '@/lib/types'
import { ContentItem, CATEGORIES } from '@/lib/content-types'
import { getFilteredContentRich } from '@/lib/content'
import { MOTION } from '@/lib/animations'

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
  toast: { success: (m: string) => void }
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
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const activeTabConfig = TABS.find(t => t.key === activeTab)!

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

  // Rich content from the content library
  const richContent = useMemo(() => getFilteredContentRich({ isMature }), [isMature])

  // Content items for the active tab
  const contentItems = richContent[activeTabConfig.contentType]

  // Available categories for this tab's content
  const availableCategories = useMemo(() => {
    const categoryIds = new Set(contentItems.map(item => item.category))
    return CATEGORIES.filter(cat => categoryIds.has(cat.id))
  }, [contentItems])

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

    return filtered
  }, [contentItems, selectedCategories, debouncedQuery])

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
    }, 200)
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
    toast.success('Shuffled! 🎲')
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

  const selectedCount = [selection.character, selection.setting, selection.circumstance].filter(Boolean).length
  const allSelected = selectedCount === 3
  const noCardsSelected = selectedCount === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
          🎴 Pick Your Cards
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <div key={tab.key} className="w-3 h-3 rounded-full transition-all duration-300"
                style={{ background: selection[tab.key] ? 'var(--color-success)' : 'var(--color-border)', transform: selection[tab.key] ? 'scale(1)' : 'scale(0.8)' }} />
            ))}
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{selectedCount}/3</span>
        </div>
      </div>

      {/* Shuffle All (only when no cards selected) */}
      {noCardsSelected && !customMode.character && !customMode.setting && !customMode.circumstance && availableCards.characters.length > 0 && (
        <motion.button
          onClick={() => { onShuffleAll(); toast.success('Shuffled! 🎲') }}
          className="btn btn-ghost w-full"
          style={{ background: 'linear-gradient(135deg, var(--color-highlight-pink), var(--color-highlight-yellow))', border: '2px solid var(--color-accent)', fontWeight: 'bold' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <span>🎲</span><span>Feeling Lucky? Shuffle All!</span>
        </motion.button>
      )}

      {/* Tabs */}
      <div className="flex gap-1" role="tablist">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const hasValue = !!selection[tab.key]
          return (
            <motion.button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-t-lg font-semibold text-sm transition-colors relative"
              style={{
                background: isActive ? 'var(--color-surface)' : 'var(--color-surface-alt)',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                boxShadow: isActive ? '0 -2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{tab.icon}</span>
              <span className="hidden min-[420px]:inline">{tab.label}</span>
              <span className="inline min-[420px]:hidden">{tab.shortLabel}</span>
              {hasValue && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={MOTION.bouncy}
                  style={{ color: 'var(--color-success)', fontSize: '12px' }}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {customMode[activeTab] ? (
            /* Custom Input Mode */
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={selection[activeTab]}
                onChange={(e) => setSelection({ ...selection, [activeTab]: e.target.value })}
                placeholder={`Enter custom ${activeTabConfig.label.toLowerCase()}...`}
                maxLength={activeTabConfig.maxCustomLength}
                className="input font-script text-lg"
                style={{ background: 'var(--color-surface-alt)', border: `2px solid ${activeTabConfig.color}`, fontStyle: 'italic' }}
                autoFocus
              />
              <button
                onClick={toggleCustom}
                className="btn btn-ghost text-sm self-start"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                🃏 Browse cards instead
              </button>
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
                    style={{ paddingLeft: '40px' }}
                  />
                  <span
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"
                    style={{ pointerEvents: 'none' }}
                  >
                    🔍
                  </span>
                </div>
                <motion.button
                  onClick={shuffleCurrentTab}
                  className="btn btn-ghost"
                  style={{ padding: '8px 12px', fontSize: '20px', flexShrink: 0 }}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  title="Shuffle"
                >
                  🎲
                </motion.button>
              </div>

              {/* Category Chips */}
              {availableCategories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {availableCategories.map(category => {
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{
                          background: isSelected ? activeTabConfig.color : 'var(--color-surface-alt)',
                          color: isSelected ? 'white' : 'var(--color-text-secondary)',
                          border: `1px solid ${isSelected ? activeTabConfig.color : 'var(--color-border)'}`,
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          flexShrink: 0,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Results Count */}
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {filteredItems.length} {filteredItems.length === 1 ? 'option' : 'options'}
                {debouncedQuery && ` matching "${debouncedQuery}"`}
              </div>

              {/* Card Grid */}
              <div className="overflow-y-auto pr-1" style={{ maxHeight: '280px', scrollbarWidth: 'thin' }}>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No matches found</p>
                    {(searchQuery || selectedCategories.length > 0) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategories([]) }}
                        className="btn btn-ghost text-xs mt-2"
                        style={{ color: activeTabConfig.color }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 max-[380px]:grid-cols-2 gap-2">
                    {filteredItems.map((item) => {
                      const isSelected = item.name === selection[activeTab]
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => selectCard(item.name)}
                          className="text-left p-2.5 rounded-lg relative"
                          style={{
                            background: isSelected ? `${activeTabConfig.color}15` : 'var(--color-surface-alt)',
                            border: isSelected ? `2px solid ${activeTabConfig.color}` : '1px solid var(--color-border)',
                            boxShadow: isSelected ? `0 0 8px ${activeTabConfig.color}30` : 'none',
                          }}
                          whileHover={{ scale: 1.02 }}
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
                              transition={{ type: 'spring', stiffness: 300 }}
                            >
                              <span className="text-white" style={{ fontSize: '10px' }}>✓</span>
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Write your own link */}
              <button
                onClick={toggleCustom}
                className="text-sm self-start"
                style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✎ Write your own
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Selected Summary */}
      {(selection.character || selection.setting || selection.circumstance) && (
        <motion.div
          className="p-3 rounded-lg"
          style={{ background: 'var(--color-highlight)', border: '2px solid var(--color-accent)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>YOUR CARDS</p>
          <div className="flex flex-col gap-1.5">
            {TABS.map(tab => {
              const value = selection[tab.key]
              return (
                <div key={tab.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{tab.icon}</span>
                    {value ? (
                      <span className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
                    ) : (
                      <button
                        onClick={() => setActiveTab(tab.key)}
                        className="italic"
                        style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Tap &ldquo;{tab.label}&rdquo; to pick
                      </button>
                    )}
                  </div>
                  {value && (
                    <motion.button
                      onClick={() => clearCard(tab.key)}
                      className="flex-shrink-0 ml-2"
                      style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: '14px' }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
