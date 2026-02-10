import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore | Plot Twists',
  description: 'Discover featured card packs, trending games, and community highlights on Plot Twists.',
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
