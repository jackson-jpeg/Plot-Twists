import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join a Game | PlotSlop',
  description: 'Someone has handed you four letters. Type them in, pick a character, and read whatever the AI wrote. No app, no account, no dignity.',
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
