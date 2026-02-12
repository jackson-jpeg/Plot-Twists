'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
}

export function AdminUsers({ users, total, search, onSearchChange, page, onPageChange, socket }: AdminUsersProps) {
  const [creditModal, setCreditModal] = useState<{ uid: string; name: string } | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [addingCredits, setAddingCredits] = useState(false)
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const handleAddCredits = () => {
    if (!creditModal) return
    const amount = parseInt(creditAmount, 10)
    if (!amount || amount <= 0 || amount > 1000) return

    setAddingCredits(true)
    socket.emit('admin_add_credits', creditModal.uid, amount, (response) => {
      setAddingCredits(false)
      if (response.success) {
        setCreditModal(null)
        setCreditAmount('')
      } else {
        alert(response.error || 'Failed to add credits')
      }
    })
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone, or UID..."
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
        />
      </div>

      {/* User list */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-[var(--color-text-secondary)] font-handwritten">
            {search ? 'No users match your search' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
                    {user.displayName}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {user.email && <span>{user.email}</span>}
                    {user.phoneNumber && <span>{user.phoneNumber}</span>}
                    <span>UID: {user.uid.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-[var(--color-text-secondary)]">
                      Credits: <span className="font-medium text-[var(--color-text-primary)]">{user.credits.free}f + {user.credits.banked}b</span>
                    </span>
                    {user.linkedAccounts.length > 0 && (
                      <span className="text-[var(--color-text-tertiary)]">
                        Linked: {user.linkedAccounts.join(', ')}
                      </span>
                    )}
                    <span className="text-[var(--color-text-tertiary)]">
                      Last seen: {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={() => setCreditModal({ uid: user.uid, name: user.displayName })}
                  className="ml-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Credits
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--color-text-tertiary)]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Credits Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreditModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1 font-display">Add Credits</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Adding credits to <span className="font-medium">{creditModal.name}</span>
            </p>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Number of credits"
              min="1"
              max="1000"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCreditModal(null)}
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleAddCredits}
                disabled={addingCredits || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-1 px-4 py-2 text-sm rounded-xl font-medium text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--color-accent)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {addingCredits ? 'Adding...' : 'Add Credits'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
