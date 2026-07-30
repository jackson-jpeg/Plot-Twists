import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile | PlotSlop',
  description: 'Your profile, your stats, and a permanent record of every scene you agreed to perform.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
