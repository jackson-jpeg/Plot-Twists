import type { Metadata } from 'next'
import { PrivacyContent } from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy | Plot Twists',
  description: 'Privacy policy for Plot Twists — the improv comedy game.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyContent />
}
