import type { Metadata } from 'next'
import { TermsContent } from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service | PlotSlop',
  description: 'Terms of service for PlotSlop — the improv comedy game.',
}

export default function TermsOfServicePage() {
  return <TermsContent />
}
