import { Metadata } from 'next'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shareCode = params.code
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plottwists.app'

  // Fetch game data from HTTP API for dynamic metadata
  let title = `Plot Twists - Replay ${shareCode}`
  let description = 'Watch this hilarious AI-generated improv scene from Plot Twists!'
  let ogTitle = 'Plot Twists - Watch This Scene!'

  try {
    const res = await fetch(`${baseUrl}/api/game/${shareCode}`, { next: { revalidate: 300 } })
    if (res.ok) {
      const game = await res.json()
      title = `"${game.title}" - Plot Twists Replay`
      ogTitle = `"${game.title}" - Plot Twists`
      const playerNames = game.players?.map((p: { character: string }) => p.character).join(', ')
      description = game.synopsis || `An improv comedy scene starring ${playerNames}. Watch the performance!`
    }
  } catch {
    // Fall back to generic metadata
  }

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      siteName: 'Plot Twists',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
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
