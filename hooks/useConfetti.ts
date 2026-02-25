'use client'

import { useCallback, useEffect, useRef } from 'react'

// Lazy-load canvas-confetti on first use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let confettiModule: any = null
async function getConfetti(): Promise<(opts?: import('canvas-confetti').Options) => void> {
  if (!confettiModule) {
    confettiModule = (await import('canvas-confetti')).default
  }
  return confettiModule
}

export function useConfetti() {
  const intervalsRef = useRef<NodeJS.Timeout[]>([])

  // Clean up any running confetti intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval)
      intervalsRef.current = []
    }
  }, [])
  const fireConfetti = useCallback(async () => {
    const confetti = await getConfetti()
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10000
    }

    function fire(particleRatio: number, opts: import('canvas-confetti').Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55
    })

    fire(0.2, {
      spread: 60
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45
    })
  }, [])

  const fireWinnerConfetti = useCallback(async () => {
    const confetti = await getConfetti()
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        intervalsRef.current = intervalsRef.current.filter(i => i !== interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })

      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
    intervalsRef.current.push(interval)
  }, [])

  const fireCelebration = useCallback(async () => {
    const confetti = await getConfetti()
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 10000
    })
  }, [])

  return {
    fireConfetti,
    fireWinnerConfetti,
    fireCelebration
  }
}
