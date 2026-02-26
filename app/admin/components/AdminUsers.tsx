'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AdminUserInfo } from '@/lib/types'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

interface AdminUsersProps {
  users: AdminUserInfo[]
  total: number
  search: string
  onSearchChange: (search: string) => void
  page: number
  onPageChange: (page: number) => void
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

const QUICK_CREDIT_AMOUNTS = [5, 10, 25, 50]

function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return 'Never'
  const secs = Math.floor((Date.now() - timestamp) / 1000)
  if (secs < 60) return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function AdminUsers({ users, total, search, onSearchChange, page, onPageChange, socket, onToast }: AdminUsersProps) {
  const [creditModal, setCreditModal] = useState<{ uid: string; name: string } | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [addingCredits, setAddingCredits] = useState(false)
  const [copiedUid, setCopiedUid] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const handleAddCredits = (amount?: number) => {
    if (!creditModal) return
    const finalAmount = amount || parseInt(creditAmount, 10)
    if (!finalAmount || finalAmount <= 0 || finalAmount > 1000) return

    setAddingCredits(true)
    socket.emit('admin_add_credits', creditModal.uid, finalAmount, (response) => {
      setAddingCredits(false)
      if (response.success) {
        onToast(`Added ${finalAmount} credit${finalAmount !== 1 ? 's' : ''} to ${creditModal.name}`, 'success')
        setCreditModal(null)
        setCreditAmount('')
      } else {
        onToast(response.error || 'Failed to add credits', 'error')
      }
    })
  }

  // Escape key closes the credit modal
  useEffect(() => {
    if (!creditModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreditModal(null)
        setCreditAmount('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [creditModal])

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid)
    setCopiedUid(uid)
    setTimeout(() => setCopiedUid(null), 1500)
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-disabled)] text-sm pointer-events-none">🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone, or UID..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
        />
        {search && (
          <button
            onClick={() => { onSearchChange(''); searchInputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] text-sm transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count */}
      {search && (
        <p className="text-xs text-[var(--color-text-disabled)] mb-3">
          {total} result{total !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* User list */}
      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <p className="text-4xl mb-3">👤</p>
          <p className="text-[var(--color-text-secondary)] font-display font-semibold mb-1">
            {search ? 'No users match your search' : 'No users found'}
          </p>
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs mt-1"
              style={{ color: 'var(--color-accent)' }}
            >
              Clear search
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => {
            const totalCredits = user.credits.free + user.credits.banked
            return (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + avatar */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(to bottom right, var(--color-purple), var(--color-pink))' }}
                      >
                        {user.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{user.displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {user.email && (
                            <span className="text-[11px] text-[var(--color-text-tertiary)]">{user.email}</span>
                          )}
                          {user.phoneNumber && (
                            <span className="text-[11px] text-[var(--color-text-tertiary)]">{user.phoneNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {/* Credits pill */}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: totalCredits > 0 ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : 'var(--color-surface-alt)',
                          color: totalCredits > 0 ? 'var(--color-success)' : 'var(--color-text-disabled)',
                        }}
                      >
                        🎬 {totalCredits} ({user.credits.free}f + {user.credits.banked}b)
                      </span>

                      {/* Linked accounts */}
                      {user.linkedAccounts.length > 0 && (
                        <span className="text-[10px] text-[var(--color-text-disabled)]">
                          {user.linkedAccounts.map(a => a === 'google' ? '🔵' : a === 'phone' ? '📱' : '✉️').join(' ')}
                        </span>
                      )}

                      {/* Last seen */}
                      <span className="text-[10px] text-[var(--color-text-disabled)]">
                        {formatRelativeDate(user.lastSeenAt)}
                      </span>

                      {/* UID copy button */}
                      <button
                        onClick={() => copyUid(user.uid)}
                        className="text-[10px] text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] transition-colors"
                        title={user.uid}
                      >
                        {copiedUid === user.uid ? '✓ Copied' : `UID: ${user.uid.slice(0, 8)}...`}
                      </button>
                    </div>
                  </div>

                  {/* Add credits button */}
                  <motion.button
                    onClick={() => setCreditModal({ uid: user.uid, name: user.displayName })}
                    className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + Credits
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--color-text-disabled)]">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Add Credits Modal */}
      <AnimatePresence>
        {creditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setCreditModal(null); setCreditAmount('') }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1 font-display">Add Credits</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Adding to <span className="font-medium text-[var(--color-text-primary)]">{creditModal.name}</span>
              </p>

              {/* Quick amount buttons */}
              <div className="flex gap-2 mb-3">
                {QUICK_CREDIT_AMOUNTS.map((amount) => (
                  <motion.button
                    key={amount}
                    onClick={() => handleAddCredits(amount)}
                    disabled={addingCredits}
                    className="flex-1 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    +{amount}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-disabled)] mb-3">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span>or custom amount</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Amount"
                  min="1"
                  max="1000"
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCredits() }}
                />
                <motion.button
                  onClick={() => handleAddCredits()}
                  disabled={addingCredits || !creditAmount || parseInt(creditAmount) <= 0}
                  className="px-4 py-2 text-sm rounded-xl font-medium text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {addingCredits ? '...' : 'Add'}
                </motion.button>
              </div>

              <button
                onClick={() => { setCreditModal(null); setCreditAmount('') }}
                className="w-full mt-3 py-2 text-xs text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
