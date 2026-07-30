import { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shareCode = params.code
  const baseUrl = SITE_URL

  // Fetch game data from HTTP API for dynamic metadata
  let title = shareCode ? `PlotSlop - Replay ${shareCode}` : 'Script Not Found | PlotSlop'
  let description = 'Watch this hilarious AI-generated improv scene from PlotSlop!'
  let ogTitle = 'PlotSlop - Watch This Scene!'

  try {
    const res = await fetch(`${baseUrl}/api/game/${shareCode}`, { next: { revalidate: 300 } })
    if (res.ok) {
      const game = await res.json()
      title = `"${game.title}" - PlotSlop Replay`
      ogTitle = `"${game.title}" - PlotSlop`
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
      siteName: 'PlotSlop',
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
