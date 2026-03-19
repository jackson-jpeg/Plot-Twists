'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING, STAGGER } from '@/lib/motion'
import { Modal } from './Modal'
import { EmptyState } from './EmptyState'
import { ContentItem, CATEGORIES } from '@/lib/content-types'

interface CardBrowseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'characters' | 'settings' | 'circumstances'
  options: ContentItem[]
  currentValue: string
  onSelect: (item: ContentItem) => void
  color: string
}

const TYPE_CONFIG = {
  characters: {
    title: 'Browse Characters',
    icon: '🎭',
    emptyTitle: 'No characters found',
    emptyDescription: 'Try adjusting your search or filters.'
  },
  settings: {
    title: 'Browse Settings',
    icon: '🏛️',
    emptyTitle: 'No settings found',
    emptyDescription: 'Try adjusting your search or filters.'
  },
  circumstances: {
    title: 'Browse Circumstances',
    icon: '⚡',
    emptyTitle: 'No circumstances found',
    emptyDescription: 'Try adjusting your search or filters.'
  }
}

export function CardBrowseModal({
  isOpen,
  onClose,
  type,
  options,
  currentValue,
  onSelect,
  color
}: CardBrowseModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const config = TYPE_CONFIG[type]

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setDebouncedQuery('')
      setSelectedCategories([])
    }
  }, [isOpen])

  // Get unique categories from the options
  const availableCategories = useMemo(() => {
    const categoryIds = new Set(options.map(opt => opt.category))
    return CATEGORIES.filter(cat => categoryIds.has(cat.id))
  }, [options])

  // Filter options based on search and categories
  const filteredOptions = useMemo(() => {
    let filtered = options

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => selectedCategories.includes(item.category))
    }

    // Filter by search query
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [options, selectedCategories, debouncedQuery])

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const handleSelect = useCallback((item: ContentItem) => {
    onSelect(item)
    onClose()
  }, [onSelect, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${config.icon} ${config.title}`}
      maxWidth="800px"
    >
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, source, or tags..."
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none', paddingLeft: '44px', transition: 'border-color 150ms, box-shadow 150ms' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-light)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <span
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl"
            style={{ pointerEvents: 'none' }}
          >
            🔍
          </span>
        </div>

        {/* Category Filter Chips */}
        {availableCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', overscrollBehavior: 'contain' }}>
            {availableCategories.map(category => {
              const isSelected = selectedCategories.includes(category.id)
              return (
                <motion.button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
                  style={{
                    background: isSelected ? color : 'var(--color-surface-alt)',
                    color: isSelected ? 'white' : 'var(--color-text-secondary)',
                    border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 400
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {filteredOptions.length} {filteredOptions.length === 1 ? 'result' : 'results'}
          {selectedCategories.length > 0 && ` in ${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'}`}
          {debouncedQuery && ` for "${debouncedQuery}"`}
        </div>

        {/* Results Grid */}
        <div
          className="max-h-96 overflow-y-auto pr-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {filteredOptions.length === 0 ? (
            <EmptyState
              variant="search"
              title={config.emptyTitle}
              description={config.emptyDescription}
              action={
                (searchQuery || selectedCategories.length > 0)
                  ? {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchQuery('')
                        setSelectedCategories([])
                      }
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredOptions.map((item, index) => {
                  const isSelected = item.name === currentValue
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="text-left p-3 rounded-lg transition-all relative"
                      style={{
                        background: isSelected ? `${color}20` : 'var(--color-surface-alt)',
                        border: isSelected ? `2px solid ${color}` : '1px solid var(--color-border)',
                        boxShadow: isSelected ? `0 0 12px ${color}40` : 'none'
                      }}
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ delay: index * STAGGER, ...SPRING }}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: `0 4px 12px rgba(0,0,0,0.1)`
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Item Name */}
                      <p
                        className="font-semibold text-sm mb-1 line-clamp-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.name}
                      </p>

                      {/* Source */}
                      {item.source && (
                        <p
                          className="text-xs mb-2 line-clamp-1"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {item.source}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: 'var(--color-border)',
                              color: 'var(--color-text-tertiary)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: 'var(--color-border)',
                              color: 'var(--color-text-tertiary)'
                            }}
                          >
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: color }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={SPRING}
                        >
                          <span className="text-white text-xs">✓</span>
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
