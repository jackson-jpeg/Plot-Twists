import type { Metadata } from 'next'
import { PrivacyContent } from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy | PlotSlop',
  description: 'Privacy policy for PlotSlop — the improv comedy game.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyContent />
}
