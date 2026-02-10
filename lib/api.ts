/**
 * Get the backend API base URL.
 * In production, the API is on Railway (separate from the Vercel frontend).
 * In development, it's the same origin (localhost:3000).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return ''  // Same origin in dev
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  if (wsUrl) {
    const cleanUrl = wsUrl.replace(/^(wss?|https?):\/\//, '')
    return `https://${cleanUrl}`
  }

  return ''  // Fallback to same origin
}
