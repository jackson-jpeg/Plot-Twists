'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { AdminRooms } from './components/AdminRooms'
import { AdminUsers } from './components/AdminUsers'
import { AdminStats } from './components/AdminStats'
import { PageContainer } from '@/components/ui/PageContainer'
import { Button } from '@/components/ui/Button'
import type { AdminRoomInfo, AdminUserInfo, AdminStats as AdminStatsType } from '@/lib/types'

type AdminTab = 'rooms' | 'users' | 'stats'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function AdminPage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('rooms')

  // Data
  const [rooms, setRooms] = useState<AdminRoomInfo[]>([])
  const [users, setUsers] = useState<AdminUserInfo[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(0)
  const [stats, setStats] = useState<AdminStatsType | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([])
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `t_${Date.now()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!authLoading && !user) router.replace('/sign-in')
  }, [authLoading, user, router])

  // Check admin status
  useEffect(() => {
    if (!socket || !isConnected) return
    socket.emit('check_admin', (response) => {
      setIsAdmin(response.isAdmin)
      if (!response.isAdmin) {
        router.replace('/sign-in')
      }
    })
  }, [socket, isConnected, router])

  // Fetch rooms
  const fetchRooms = useCallback(() => {
    if (!socket || !isConnected || !isAdmin) return
    socket.emit('admin_get_rooms', (response) => {
      if (response.success) setRooms(response.rooms)
    })
  }, [socket, isConnected, isAdmin])

  // Fetch users
  const fetchUsers = useCallback(() => {
    if (!socket || !isConnected || !isAdmin) return
    socket.emit('admin_get_users', { limit: 20, offset: userPage * 20, search: userSearch }, (response) => {
      if (response.success) {
        setUsers(response.users)
        setUserTotal(response.total)
      }
    })
  }, [socket, isConnected, isAdmin, userPage, userSearch])

  // Fetch stats
  const fetchStats = useCallback(() => {
    if (!socket || !isConnected || !isAdmin) return
    socket.emit('admin_get_stats', (response) => {
      if (response.success) setStats(response.stats)
    })
  }, [socket, isConnected, isAdmin])

  // Refresh all data
  const refreshAll = useCallback(() => {
    setIsRefreshing(true)
    fetchRooms()
    fetchStats()
    fetchUsers()
    setLastRefreshed(new Date())
    setTimeout(() => setIsRefreshing(false), 600)
  }, [fetchRooms, fetchStats, fetchUsers])

  // Initial data fetch + auto-refresh
  useEffect(() => {
    if (!isAdmin) return
    refreshAll()

    const interval = setInterval(() => {
      fetchRooms()
      fetchStats()
      setLastRefreshed(new Date())
    }, 10_000)

    return () => clearInterval(interval)
  }, [isAdmin, refreshAll, fetchRooms, fetchStats])

  // Debounced user search — stores pending search and fetches after delay
  const pendingSearchRef = useRef(userSearch)
  const handleSearchChange = useCallback((search: string) => {
    setUserSearch(search)
    pendingSearchRef.current = search
    setUserPage(0)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      // fetchUsers reads userSearch from state, but the state update from setUserSearch
      // will have taken effect by now, so the next render will trigger the effect below
      fetchUsers()
    }, 300)
  }, [fetchUsers])

  // Re-fetch users when page changes
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage])

  // Keyboard shortcuts: 1/2/3 to switch tabs, R to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case '1': setActiveTab('rooms'); break
        case '2': setActiveTab('users'); break
        case '3': setActiveTab('stats'); break
        case 'r': refreshAll(); break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [refreshAll])

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <PageContainer size="wide" centered>
        <div className="text-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block text-3xl mb-3"
          >
            ⚙️
          </motion.div>
          <p className="text-[var(--color-text-secondary)]">Checking access...</p>
        </div>
      </PageContainer>
    )
  }

  if (!isAdmin) return null

  const tabs: { id: AdminTab; label: string; icon: string; count?: number; shortcut: string }[] = [
    { id: 'rooms', label: 'Rooms', icon: '🏠', count: rooms.length, shortcut: '1' },
    { id: 'users', label: 'Users', icon: '👥', count: userTotal, shortcut: '2' },
    { id: 'stats', label: 'Stats', icon: '📊', shortcut: '3' },
  ]

  const formatLastRefreshed = () => {
    if (!lastRefreshed) return ''
    const secs = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000)
    if (secs < 5) return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}m ago`
  }

  return (
    <PageContainer size="wide">
      {/* Toast container */}
      <div className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none" style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto px-4 py-2 rounded-full shadow-lg border text-sm font-medium"
              style={{
                backgroundColor: toast.type === 'success' ? 'var(--color-success-light)' : toast.type === 'error' ? 'var(--color-danger-light)' : 'var(--color-surface)',
                borderColor: toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-border)',
                color: toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-text-primary)',
              }}
            >
              {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : 'ℹ '}{toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Back button */}
      <div className="fixed left-4 z-50" style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <Button variant="secondary" size="sm" icon={<span className="text-xl">←</span>} onClick={() => router.push('/')}>
          Home
        </Button>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 pt-20 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display">Admin Dashboard</h1>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
                  color: 'var(--color-danger)',
                }}
              >
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Last refreshed */}
              {lastRefreshed && (
                <span className="text-xs text-[var(--color-text-disabled)] hidden sm:inline">
                  Updated {formatLastRefreshed()}
                </span>
              )}
              {/* Refresh button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshAll}
                disabled={isRefreshing}
                icon={
                  <motion.span
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={isRefreshing ? { duration: 0.6, ease: 'linear' } : {}}
                    className="inline-block"
                  >
                    ↻
                  </motion.span>
                }
              >
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Signed in as {user?.email || user?.phoneNumber || 'Admin'}
            {stats && (
              <span className="ml-3 text-[var(--color-text-disabled)]">
                {stats.connectedSockets} socket{stats.connectedSockets !== 1 ? 's' : ''} connected
              </span>
            )}
          </p>
        </motion.div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative mb-5" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                title={`${tab.label} (${tab.shortcut})`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px text-sm ${
                  isActive
                    ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] z-10'
                    : 'bg-[var(--color-surface-alt)] border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                style={{
                  transform: isActive ? 'translateY(-2px)' : undefined,
                  boxShadow: isActive ? 'var(--shadow-2)' : 'none',
                }}
                whileHover={!isActive ? { y: -2 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'var(--color-surface-elevated)',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-disabled)',
                    }}
                  >
                    {tab.count > 999 ? '999+' : tab.count}
                  </span>
                )}
              </motion.button>
            )
          })}

          {/* Live pulse dot */}
          <div className="ml-auto flex items-center gap-1.5 px-2 text-[10px] text-[var(--color-text-disabled)]">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
              animate={isConnected ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'rooms' && (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminRooms rooms={rooms} socket={socket!} onToast={showToast} onRefresh={refreshAll} />
            </motion.div>
          )}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminUsers
                users={users}
                total={userTotal}
                search={userSearch}
                onSearchChange={handleSearchChange}
                page={userPage}
                onPageChange={setUserPage}
                socket={socket!}
                onToast={showToast}
              />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminStats stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}
