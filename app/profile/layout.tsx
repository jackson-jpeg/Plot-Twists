import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile | Plot Twists',
  description: 'View your Plot Twists profile, game history, achievements, and stats.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
