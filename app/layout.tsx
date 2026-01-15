import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SocketProvider } from '@/contexts/SocketContext'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Plot Twists - AI Improv Party Game',
  description: 'An AI-powered improv comedy game. Pick random cards, perform hilarious stories, vote for MVP. Perfect for theater kids and game nights!',
  keywords: ['improv', 'party game', 'comedy', 'AI', 'theater', 'multiplayer', 'social game'],
  authors: [{ name: 'Plot Twists' }],
  openGraph: {
    title: 'Plot Twists - AI Improv Party Game',
    description: 'An AI-powered improv comedy game. Pick random cards, perform hilarious stories, vote for MVP.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plot Twists - AI Improv Party Game',
    description: 'An AI-powered improv comedy game. Pick random cards, perform hilarious stories, vote for MVP.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#F59E42',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
        <Analytics />
      </body>
    </html>
  )
}
