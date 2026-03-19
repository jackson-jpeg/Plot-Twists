import type { Metadata } from 'next'
import { TermsContent } from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service | Plot Twists',
  description: 'Terms of service for Plot Twists — the improv comedy game.',
}

export default function TermsOfServicePage() {
  return <TermsContent />
}
