'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getApiBaseUrl } from '@/lib/api'
import type { UserPreferences, GameMode, TeleprompterVisibilityMode } from '@/lib/types'
import { DEFAULT_TELEPROMPTER_SETTINGS, TELEPROMPTER_PRESETS } from '@/lib/types'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import { useTheme } from '@/contexts/ThemeContext'

interface AccountSettingsProps {
  onClose?: () => void
}

// Helper to get/set preferences from localStorage
const PREFS_KEY = 'plottwists_preferences'

function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function setStoredPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function AccountSettings({ onClose }: AccountSettingsProps) {
  const {
    user,
    signOut,
    isConfigured,
    getToken
  } = useAuth()

  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'danger'>('profile')

  // Profile editing state
  const [editingName, setEditingName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultNickname: '',
    preferredGameMode: undefined,
    soundEffectsEnabled: true,
    notificationsEnabled: true
  })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsSuccess, setPrefsSuccess] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Theme
  const { theme, setTheme } = useTheme()

  // Teleprompter settings
  const {
    settings: teleprompterSettings,
    setPreset: setTeleprompterPreset,
    setCustom: setTeleprompterCustom,
    toggleAutoScroll: toggleTeleprompterAutoScroll
  } = useTeleprompterSettings()

  // Load preferences on mount from localStorage
  useEffect(() => {
    const stored = getStoredPreferences()
    setPreferences(prev => ({ ...prev, ...stored }))
  }, [])

  // Update display name via Clerk
  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('Display name cannot be empty')
      return
    }

    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)

    try {
      // Use Clerk's user update API
      const { useUser } = await import('@clerk/nextjs')
      // Since we can't call hooks here, use fetch to Clerk's API
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      // Update via our server which can use Clerk Backend SDK
      const res = await fetch(`${(await import('@/lib/api')).getApiBaseUrl()}/api/account/update-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      })

      if (res.ok) {
        setNameSuccess(true)
        setEditingName(false)
        setTimeout(() => setNameSuccess(false), 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setNameError(data.error || 'Failed to update display name')
      }
    } catch {
      setNameError('Failed to update display name')
    }

    setNameLoading(false)
  }

  // Save preferences to localStorage
  const handleSavePreferences = async () => {
    setPrefsLoading(true)
    setPrefsSuccess(false)

    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))

    setStoredPreferences(preferences)
    setPrefsLoading(false)
    setPrefsSuccess(true)
    setTimeout(() => setPrefsSuccess(false), 3000)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return
    }

    setDeleteLoading(true)

    try {
      const token = await getToken()

      if (!token) {
        alert('Unable to verify your identity. Please sign in again and retry.')
        setDeleteLoading(false)
        return
      }

      const res = await fetch(`${getApiBaseUrl()}/api/account/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out and redirect to home
      await signOut()
      window.location.href = '/'
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account. Please try again.')
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  if (!user || !isConfigured) {
    return null
  }

  return (
    <motion.div
      className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header - Click to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] font-display">
              Account Settings
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Manage your profile and preferences
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.span>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border)]">
              {/* Section Tabs */}
              <div className="flex border-b border-[var(--color-border)] overflow-x-auto">
                {[
                  { key: 'profile', label: 'Profile' },
                  { key: 'preferences', label: 'Prefs' },
                  { key: 'danger', label: 'Danger' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSection(tab.key as typeof activeSection)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeSection === tab.key
                        ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Section Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Display Name</label>
                        {editingName ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDisplayName}
                              onChange={(e) => setNewDisplayName(e.target.value)}
                              className="flex-1 w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                              placeholder="Enter display name"
                            />
                            <button
                              onClick={handleUpdateDisplayName}
                              disabled={nameLoading}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                            >
                              {nameLoading ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false)
                                setNewDisplayName(user?.displayName || '')
                                setNameError('')
                              }}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium"
                              style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--color-text-primary)]">
                              {user?.displayName || 'Not set'}
                            </span>
                            <button
                              onClick={() => setEditingName(true)}
                              className="text-[var(--color-accent)] hover:underline text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        {nameError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{nameError}</p>}
                        {nameSuccess && (
                          <p className="text-[var(--color-success)] text-sm mt-1">
                            Display name updated!
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phone</label>
                        <p className="text-[var(--color-text-primary)]">
                          {user?.phoneNumber || 'No phone linked'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Account Type</label>
                        <p className="text-[var(--color-text-primary)]">
                          {user?.isAnonymous ? 'Anonymous (Guest)' : 'Registered'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Preferences Section */}
                  {activeSection === 'preferences' && (
                    <motion.div
                      key="preferences"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Theme</label>
                        <div className="flex gap-2">
                          {([
                            { value: 'system', label: 'System' },
                            { value: 'light', label: 'Light' },
                            { value: 'dark', label: 'Dark' },
                          ] as const).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setTheme(option.value)}
                              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                theme === option.value
                                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-disabled)' }}>Choose light, dark, or follow your device setting</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Default Nickname</label>
                        <input
                          type="text"
                          value={preferences.defaultNickname || ''}
                          onChange={(e) => setPreferences({ ...preferences, defaultNickname: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                          placeholder="Your in-game nickname"
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-disabled)' }}>Used when joining games</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Preferred Game Mode</label>
                        <select
                          value={preferences.preferredGameMode || ''}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            preferredGameMode: e.target.value as GameMode || undefined
                          })}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                        >
                          <option value="">No preference</option>
                          <option value="solo">Solo</option>
                          <option value="head_to_head">Head to Head</option>
                          <option value="ensemble">Ensemble</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">Sound Effects</p>
                          <p className="text-sm text-[var(--color-text-tertiary)]">Play sounds during games</p>
                        </div>
                        <button
                          onClick={() => setPreferences({
                            ...preferences,
                            soundEffectsEnabled: !preferences.soundEffectsEnabled
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.soundEffectsEnabled
                              ? 'bg-[var(--color-accent)]'
                              : 'bg-[var(--color-border)]'
                          }`}
                        >
                          <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow"
                            animate={{ x: preferences.soundEffectsEnabled ? 26 : 2 }}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">Notifications</p>
                          <p className="text-sm text-[var(--color-text-tertiary)]">Get notified about game events</p>
                        </div>
                        <button
                          onClick={() => setPreferences({
                            ...preferences,
                            notificationsEnabled: !preferences.notificationsEnabled
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.notificationsEnabled
                              ? 'bg-[var(--color-accent)]'
                              : 'bg-[var(--color-border)]'
                          }`}
                        >
                          <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow"
                            animate={{ x: preferences.notificationsEnabled ? 26 : 2 }}
                          />
                        </button>
                      </div>

                      {/* Teleprompter Settings */}
                      <div className="pt-4 border-t border-[var(--color-border)]">
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">
                          Teleprompter View
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>View Mode</label>
                            <select
                              value={teleprompterSettings.visibilityMode}
                              onChange={(e) => {
                                const mode = e.target.value as TeleprompterVisibilityMode
                                if (mode === 'custom') {
                                  setTeleprompterCustom(
                                    typeof teleprompterSettings.pastLinesVisible === 'number' ? teleprompterSettings.pastLinesVisible : 2,
                                    typeof teleprompterSettings.upcomingLinesVisible === 'number' ? teleprompterSettings.upcomingLinesVisible : 3
                                  )
                                } else {
                                  setTeleprompterPreset(mode)
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                            >
                              <option value="focused">Focused (1 past, 1 upcoming)</option>
                              <option value="balanced">Balanced (2 past, 3 upcoming)</option>
                              <option value="full">Full (all lines visible)</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>

                          {teleprompterSettings.visibilityMode === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-[var(--color-border)]">
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Past Lines</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  value={teleprompterSettings.pastLinesVisible === 'all' ? 5 : teleprompterSettings.pastLinesVisible}
                                  onChange={(e) => setTeleprompterCustom(
                                    parseInt(e.target.value) || 0,
                                    teleprompterSettings.upcomingLinesVisible
                                  )}
                                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Upcoming Lines</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={teleprompterSettings.upcomingLinesVisible === 'all' ? 10 : teleprompterSettings.upcomingLinesVisible}
                                  onChange={(e) => setTeleprompterCustom(
                                    teleprompterSettings.pastLinesVisible,
                                    parseInt(e.target.value) || 1
                                  )}
                                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-medium text-[var(--color-text-primary)]">Auto-scroll</p>
                              <p className="text-sm text-[var(--color-text-tertiary)]">Keep current line centered</p>
                            </div>
                            <button
                              onClick={toggleTeleprompterAutoScroll}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                teleprompterSettings.autoScroll
                                  ? 'bg-[var(--color-accent)]'
                                  : 'bg-[var(--color-border)]'
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{ x: teleprompterSettings.autoScroll ? 26 : 2 }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSavePreferences}
                        disabled={prefsLoading}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold"
                        style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        {prefsLoading ? 'Saving...' : 'Save Preferences'}
                      </button>
                      {prefsSuccess && (
                        <p className="text-[var(--color-success)] text-sm text-center">
                          Preferences saved!
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Danger Zone Section */}
                  {activeSection === 'danger' && (
                    <motion.div
                      key="danger"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-[var(--color-danger-light)] border border-[var(--color-danger)] rounded-lg">
                        <h4 className="font-semibold text-[var(--color-danger)] mb-2">
                          Delete Account
                        </h4>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                          This action is permanent and cannot be undone. All your data, including stats, achievements, and game history will be permanently deleted.
                        </p>

                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold"
                            style={{
                              background: 'var(--color-danger)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Delete My Account
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-[var(--color-danger)]">
                              Type "DELETE" to confirm:
                            </p>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                              placeholder='Type "DELETE"'
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setDeleteConfirmText('')
                                }}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                                style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                                style={{
                                  background: deleteConfirmText === 'DELETE' ? 'var(--color-danger)' : 'var(--color-text-disabled)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                                }}
                              >
                                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
