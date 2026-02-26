import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Fredoka, DM_Sans, Courier_Prime, Permanent_Marker } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { SocketProvider } from '@/contexts/SocketContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { SystemStatus } from '@/components/SystemStatus'
import { HomeJsonLd } from '@/components/JsonLd'
import { InstallPrompt } from '@/components/InstallPrompt'
import { NativeBootstrap } from '@/components/NativeBootstrap'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { BottomTabBar } from '@/components/BottomTabBar'

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
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#A855F7',
          colorText: 'var(--color-text-primary)',
          colorTextSecondary: 'var(--color-text-secondary)',
          colorBackground: 'var(--color-surface)',
          colorInputBackground: 'var(--color-surface-alt)',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-fredoka), var(--font-dm-sans), sans-serif',
        },
        elements: {
          card: 'bg-[var(--color-surface)] shadow-none',
          cardBox: 'shadow-none',
          headerTitle: 'font-display text-[var(--color-text-primary)]',
          headerSubtitle: 'text-[var(--color-text-secondary)]',
          socialButtonsBlockButton: 'border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]',
          formButtonPrimary: 'bg-[var(--color-purple)] hover:bg-[var(--color-purple-hover)]',
          formFieldInput: 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-primary)]',
          formFieldLabel: 'text-[var(--color-text-secondary)]',
          formFieldErrorText: 'text-[var(--color-danger,#f87171)]',
          footerActionLink: 'text-[var(--color-accent)]',
          identityPreviewEditButton: 'text-[var(--color-accent)]',
          dividerLine: 'bg-[var(--color-border)]',
          dividerText: 'text-[var(--color-text-tertiary)]',
          otpCodeFieldInput: 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-primary)]',
          alertText: 'text-[var(--color-text-secondary)]',
          userButtonPopoverCard: 'bg-[var(--color-surface)] border border-[var(--color-border)]',
          userButtonPopoverActionButton: 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]',
          userPreviewMainIdentifier: 'text-[var(--color-text-primary)]',
          userPreviewSecondaryIdentifier: 'text-[var(--color-text-secondary)]',
        },
      }}
    >
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
          <NativeBootstrap />
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <ConnectionStatus />
                {children}
                <BottomTabBar />
              </SocketProvider>
            </AuthProvider>
            <SystemStatus />
            <InstallPrompt />
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}
