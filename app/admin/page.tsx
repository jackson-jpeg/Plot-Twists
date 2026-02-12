'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { AdminRooms } from './components/AdminRooms'
import { AdminUsers } from './components/AdminUsers'
import { AdminStats } from './components/AdminStats'
import type { AdminRoomInfo, AdminUserInfo, AdminStats as AdminStatsType } from '@/lib/types'

type AdminTab = 'rooms' | 'users' | 'stats'

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

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Check admin status
  useEffect(() => {
    if (!socket || !isConnected) return
    socket.emit('check_admin', (response) => {
      setIsAdmin(response.isAdmin)
      if (!response.isAdmin) {
        router.replace('/')
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

  // Initial data fetch + auto-refresh
  useEffect(() => {
    if (!isAdmin) return
    fetchRooms()
    fetchStats()
    fetchUsers()

    const interval = setInterval(() => {
      fetchRooms()
      fetchStats()
    }, 10_000)

    return () => clearInterval(interval)
  }, [isAdmin, fetchRooms, fetchStats, fetchUsers])

  // Debounced user search
  const handleSearchChange = useCallback((search: string) => {
    setUserSearch(search)
    setUserPage(0)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      // fetchUsers will be triggered by the userSearch dependency change
    }, 300)
  }, [])

  // Re-fetch users when search or page changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <main className="page-container home-nostalgic">
        <div className="container max-w-4xl pt-20 pb-8 px-4">
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
        </div>
      </main>
    )
  }

  if (!isAdmin) return null

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'rooms', label: 'Rooms', icon: '🏠' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ]

  return (
    <main className="page-container home-nostalgic">
      {/* Back button */}
      <motion.button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg shadow-lg hover:shadow-xl transition-all"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xl">←</span>
        <span className="font-medium text-[var(--color-text-primary)]">Home</span>
      </motion.button>

      <div className="container max-w-4xl pt-20 pb-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
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
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Signed in as {user?.email || user?.phoneNumber || 'Admin'}
          </p>
        </motion.div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative mb-5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
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
                {tab.id === 'rooms' && rooms.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-[var(--color-text-tertiary)]">({rooms.length})</span>
                )}
              </motion.button>
            )
          })}
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
              <AdminRooms rooms={rooms} socket={socket!} />
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
    </main>
  )
}
