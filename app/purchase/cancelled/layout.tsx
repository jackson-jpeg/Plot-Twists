import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Purchase Cancelled - Plot Twists',
  description: 'Your purchase was cancelled. No charges were made.',
}

export default function PurchaseCancelledLayout({ children }: { children: React.ReactNode }) {
  return children
}
