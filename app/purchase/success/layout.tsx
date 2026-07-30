import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Purchase Complete - PlotSlop',
  description: 'Your credits have been added to your account.',
}

export default function PurchaseSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
