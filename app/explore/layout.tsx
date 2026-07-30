import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore | PlotSlop',
  description: 'Card packs, recent scenes, and the slop other people have already performed in public.',
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
