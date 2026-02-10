import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join a Game | Plot Twists',
  description: 'Join an improv comedy game on Plot Twists. Enter a room code, pick your character, and perform AI-written comedy scripts with friends.',
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
