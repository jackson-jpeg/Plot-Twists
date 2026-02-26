'use client'

export function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Plot Twists',
    description: 'An AI-powered improv comedy party game. Pick random cards, AI writes hilarious scripts, perform them live, and vote for MVP.',
    url: 'https://plottwists.app',
    applicationCategory: 'Game',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '5 free scripts per week',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script/gi, '<\\/script') }}
    />
  )
}

export function ReplayJsonLd({
  title,
  synopsis,
  url,
  playedAt,
}: {
  title: string
  synopsis: string
  url: string
  playedAt?: number
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: synopsis,
    url,
    creator: { '@type': 'Organization', name: 'Plot Twists' },
    genre: 'Comedy',
    ...(playedAt && { dateCreated: new Date(playedAt).toISOString() }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script/gi, '<\\/script') }}
    />
  )
}
