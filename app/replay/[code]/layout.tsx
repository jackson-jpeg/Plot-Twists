import { Metadata } from 'next'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shareCode = params.code

  // Base metadata - the actual game title would require server-side fetch
  // For now, use generic OG tags that still look good when shared
  return {
    title: `Plot Twists - Replay ${shareCode}`,
    description: 'Watch this hilarious AI-generated improv scene from Plot Twists!',
    openGraph: {
      title: 'Plot Twists - Watch This Scene!',
      description: 'An AI-generated improv comedy script created with Plot Twists. Watch the performance and see who won MVP!',
      type: 'website',
      siteName: 'Plot Twists',
      images: [
        {
          url: '/og-replay.png',
          width: 1200,
          height: 630,
          alt: 'Plot Twists - Improv Comedy Game'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Plot Twists - Watch This Scene!',
      description: 'An AI-generated improv comedy script. Watch the performance!',
      images: ['/og-replay.png']
    }
  }
}

export default function ReplayLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
