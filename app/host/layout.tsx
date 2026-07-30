import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Host a Game | PlotSlop',
  description: 'Host an AI-powered improv comedy game. Create a room, invite players, and let AI write hilarious scripts for your group to perform.',
}

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return children
}
