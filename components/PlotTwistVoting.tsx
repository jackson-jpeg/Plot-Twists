'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { PlotTwistOption } from '@/lib/types'

interface PlotTwistVotingProps {
  roomCode: string
  isHost?: boolean
}

export function PlotTwistVoting({ roomCode, isHost = false }: PlotTwistVotingProps) {
  const { socket } = useSocket()
  const [isActive, setIsActive] = useState(false)
  const [options, setOptions] = useState<PlotTwistOption[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [winningTwist, setWinningTwist] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleTwistStarted = (twist: { id: string, options: PlotTwistOption[], expiresAt: number }) => {
      setOptions(twist.options)
      setTimeRemaining(Math.ceil((twist.expiresAt - Date.now()) / 1000))
      setIsActive(true)
      setHasVoted(false)
      setWinningTwist(null)
    }

    const handleVoteUpdate = (optionId: string, newCount: number) => {
      setOptions(prev => prev.map(o =>
        o.id === optionId ? { ...o, votes: newCount } : o
      ))
    }

    const handleTwistResult = (twist: string) => {
      setWinningTwist(twist)
      setIsActive(false)

      // Clear after showing result
      setTimeout(() => {
        setWinningTwist(null)
        setOptions([])
      }, 5000)
    }

    socket.on('plot_twist_started', handleTwistStarted)
    socket.on('plot_twist_vote_update', handleVoteUpdate)
    socket.on('plot_twist_result', handleTwistResult)

    return () => {
      socket.off('plot_twist_started', handleTwistStarted)
      socket.off('plot_twist_vote_update', handleVoteUpdate)
      socket.off('plot_twist_result', handleTwistResult)
    }
  }, [socket])

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeRemaining])

  const startPlotTwist = () => {
    if (!socket || !isHost) return
    socket.emit('start_plot_twist', roomCode)
  }

  const voteTwist = (optionId: string) => {
    if (!socket || hasVoted) return
    socket.emit('vote_plot_twist', roomCode, optionId)
    setHasVoted(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50])
    }
  }

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0)

  return (
    <>
      {/* Host: Start Plot Twist Button */}
      {isHost && !isActive && !winningTwist && (
        <motion.button
          onClick={startPlotTwist}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-20 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold shadow-lg"
        >
          Trigger Plot Twist
        </motion.button>
      )}

      {/* Voting UI */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">PLOT TWIST!</h2>
                <p className="text-gray-400">Vote for the next twist</p>
                <div className="text-3xl font-mono text-purple-400 mt-2">
                  {timeRemaining}s
                </div>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => voteTwist(option.id)}
                      disabled={hasVoted}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-full p-4 rounded-xl text-left relative overflow-hidden transition-all ${
                        hasVoted
                          ? 'bg-gray-800 cursor-default'
                          : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      {/* Vote progress bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="absolute inset-y-0 left-0 bg-purple-600/30"
                      />

                      <div className="relative z-10 flex justify-between items-center">
                        <span className="text-white">{option.text}</span>
                        <span className="text-purple-400 font-bold ml-2">
                          {option.votes}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {hasVoted && (
                <p className="text-center text-gray-400 mt-4">
                  Vote recorded! Waiting for results...
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winning Twist Announcement */}
      <AnimatePresence>
        {winningTwist && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 max-w-md w-full text-center">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: 2, duration: 0.3 }}
                className="text-6xl mb-4"
              >
                🎭
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-4">PLOT TWIST!</h2>
              <p className="text-white text-xl">{winningTwist}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
