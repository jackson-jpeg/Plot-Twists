'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { MOTION } from '@/lib/animations'

export function ReferralCard() {
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRedeem, setShowRedeem] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchReferralInfo = useCallback(() => {
    if (!socket || !isConnected || !user || user.isAnonymous) return
    setLoading(true)
    socket.emit('get_referral_info', (response) => {
      setLoading(false)
      if (response.success) {
        setReferralCode(response.referralCode || null)
        setCreditsEarned(response.referralCreditsEarned || 0)
        setReferralCount(response.referralCount || 0)
      }
    })
  }, [socket, isConnected, user])

  useEffect(() => {
    fetchReferralInfo()
  }, [fetchReferralInfo])

  const handleCopy = async () => {
    if (!referralCode) return
    const text = `Join me on Plot Twists! Use my invite code: ${referralCode}\nhttps://plottwists.live/join`
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRedeem = () => {
    if (!socket || !redeemCode.trim()) return
    setRedeemLoading(true)
    setRedeemError('')
    setRedeemSuccess(false)

    socket.emit('redeem_referral', redeemCode.trim().toUpperCase(), (response) => {
      setRedeemLoading(false)
      if (response.success) {
        setRedeemSuccess(true)
        setRedeemCode('')
        setShowRedeem(false)
      } else {
        setRedeemError(response.error || 'Failed to redeem code')
      }
    })
  }

  if (!user || user.isAnonymous) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm"
    >
      <div className="p-4">
        <h3 className="font-semibold text-[var(--color-text-primary)] font-display flex items-center gap-2 mb-3">
          Invite Friends
        </h3>

        {loading ? (
          <div className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">Loading...</div>
        ) : (
          <div className="space-y-3">
            {/* Referral code display */}
            {referralCode && (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-center">
                  <span className="text-lg font-bold font-display tracking-widest text-[var(--color-text-primary)]">
                    {referralCode}
                  </span>
                </div>
                <motion.button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    background: copied ? 'var(--color-success)' : 'var(--color-accent)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    minWidth: '72px',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? 'Copied!' : 'Share'}
                </motion.button>
              </div>
            )}

            <p className="text-xs text-[var(--color-text-tertiary)]">
              You get 3 bonus scripts when a friend signs up with your code. They get 2!
            </p>

            {/* Stats */}
            {(referralCount > 0 || creditsEarned > 0) && (
              <div className="flex gap-4 text-center pt-1">
                <div>
                  <div className="text-lg font-bold text-[var(--color-text-primary)] font-display">{referralCount}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">Friends joined</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--color-accent)] font-display">+{creditsEarned}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">Bonus scripts</div>
                </div>
              </div>
            )}

            {/* Redeem toggle */}
            <AnimatePresence>
              {redeemSuccess && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-[var(--color-success)] text-center font-medium"
                >
                  Referral code redeemed! Bonus credits added.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowRedeem(!showRedeem)}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {showRedeem ? 'Cancel' : 'Have a friend\'s code?'}
            </button>

            <AnimatePresence>
              {showRedeem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={MOTION.gentle}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => {
                        setRedeemCode(e.target.value.toUpperCase())
                        setRedeemError('')
                      }}
                      placeholder="Enter code"
                      maxLength={6}
                      className="input flex-1 text-center tracking-widest font-bold uppercase"
                    />
                    <button
                      onClick={handleRedeem}
                      disabled={redeemLoading || redeemCode.length < 6}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      {redeemLoading ? '...' : 'Redeem'}
                    </button>
                  </div>
                  {redeemError && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">{redeemError}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
