import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quick Play - Plot Twists',
  description: 'Jump into an improv comedy game with other players. No room code needed.',
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children
}
