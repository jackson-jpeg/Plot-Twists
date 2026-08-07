/** @type {import('next').NextConfig} */
// Build cache bust: 2026-02-04T15:45:00Z
const nextConfig = {
  reactStrictMode: true,

  // Design-preview harness (design/2026-08-06 pass): route files named
  // *.preview.tsx exist ONLY in builds that set NEXT_PUBLIC_DESIGN_PREVIEW=1.
  // deploy.sh never sets it, so the harness route is absent from shipped
  // bundles — a build-time exclusion, unlike the runtime notFound() guard
  // inside the page itself (which stays as defense in depth).
  pageExtensions:
    process.env.NEXT_PUBLIC_DESIGN_PREVIEW === '1'
      ? ['preview.tsx', 'tsx', 'ts', 'jsx', 'js']
      : ['tsx', 'ts', 'jsx', 'js'],

  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Environment variables that should be available on the client
  //
  // NEXT_PUBLIC_APP_URL IS DELIBERATELY NOT DEFAULTED HERE. It used to read
  // `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`, and because Next inlines this
  // block at BUILD time, an unset variable baked the literal 'http://localhost:3000' into the
  // production bundle. Every `NEXT_PUBLIC_BASE_URL || NEXT_PUBLIC_APP_URL || <domain>` chain in
  // the app therefore stopped at the second term, and the live site advertised
  // og:image="http://localhost:3000/opengraph-image" and a localhost sitemap. Defaulting a
  // public origin in the bundler is what made that invisible; the fallback now lives in
  // lib/siteUrl.ts, where it can see NODE_ENV. Leave this unset.
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false',
    NEXT_PUBLIC_ENABLE_ERROR_TRACKING: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING || 'false',
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://sang3r.com https://www.sang3r.com",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {},

  // WebSocket configuration for custom server (webpack fallback for legacy builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // Standalone output for Docker deployment
  output: process.env.DOCKER ? 'standalone' : undefined,
}

module.exports = nextConfig
