import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plottwists.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/join', '/host', '/replay/*', '/explore'],
        disallow: ['/api/', '/purchase/', '/profile'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
