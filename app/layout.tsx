import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Fredoka, DM_Sans, Courier_Prime, Permanent_Marker } from 'next/font/google'
import { SocketProvider } from '@/contexts/SocketContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { SystemStatus } from '@/components/SystemStatus'
import { HomeJsonLd } from '@/components/JsonLd'
import { InstallPrompt } from '@/components/InstallPrompt'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-courier-prime',
  display: 'swap',
})

const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-permanent-marker',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Plot Twists - AI Improv Party Game',
  description: 'An AI-powered improv comedy game. Pick random cards, perform hilarious stories, vote for MVP. Perfect for theater kids and game nights!',
  keywords: ['improv', 'party game', 'comedy', 'AI', 'theater', 'multiplayer', 'social game'],
  authors: [{ name: 'Plot Twists' }],
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'icon', url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icons/icon-192.png', sizes: '192x192' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Plot Twists',
  },
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
  viewportFit: 'cover',
  themeColor: '#F59E42',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${dmSans.variable} ${courierPrime.variable} ${permanentMarker.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('plot-twists-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <HomeJsonLd />
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
          <SystemStatus />
          <InstallPrompt />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
